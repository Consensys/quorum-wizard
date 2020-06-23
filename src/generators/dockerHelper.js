import {
  copyFile,
  formatNewLine,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { getFullNetworkPath } from './networkCreator'
import { buildCakeshopDir } from './cakeshopHelper'
import { loadTesseraPublicKey } from './transactionManager'
import {
  isTessera,
  isCakeshop,
  isSplunk,
} from '../model/NetworkConfig'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import {
  cidrhost,
  buildDockerIp,
} from '../utils/subnetUtils'
import { isQuorum260Plus } from './binaryHelper'

export function buildDockerCompose(config) {
  const hasTessera = isTessera(config.network.transactionManager)
  const hasCakeshop = isCakeshop(config.network.cakeshop)
  const hasSplunk = isSplunk(config.network.splunk)
  const txGenerate = config.network.txGenerate

  const quorumDefinitions = readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-quorum.yml',
  ))

  const tesseraDefinitions = hasTessera ? readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-tessera.yml',
  )) : ''

  const cakeshopDefinitions = hasCakeshop ? readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-cakeshop.yml',
  )) : ''

  const splunkDefinitions = hasSplunk ? readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-splunk.yml'
  )) : ''

  const cadvisdorDefinitions = hasSplunk ? buildCadvisorDefinition(config) : ''

  const ethloggerDefinitions = hasSplunk ? buildEthloggerDefinitions(config) : ''

  let services = config.nodes.map((node, i) => {
    let allServices = buildNodeService(config, node, i, hasTessera, hasSplunk, txGenerate)
    if (hasTessera) {
      allServices = [allServices, buildTesseraService(config, node, i, hasSplunk)].join('')
    }
    return allServices
  })
  if (hasCakeshop) {
    services = [services.join(''), buildCakeshopService(config.network.cakeshopPort, hasSplunk)]
  }
  if (hasSplunk) {
    services = [services.join(''),
      buildSplunkService(config, txGenerate),
      buildEthloggerService(config),
      buildCadvisorService(config)]
    info('Splunk>')
  }
  if (txGenerate) {
    let pubkeys = []
    config.nodes.forEach((_, i) => {
      pubkeys.push(loadTesseraPublicKey(config, i + 1))
    });

    services = [services.join(''),
      buildTxGenService(hasSplunk, config, pubkeys)]
  }

  return [
    formatNewLine(quorumDefinitions),
    formatNewLine(tesseraDefinitions),
    formatNewLine(cakeshopDefinitions),
    formatNewLine(splunkDefinitions),
    formatNewLine(cadvisdorDefinitions),
    formatNewLine(ethloggerDefinitions),
    'services:',
    services.join(''),
    buildEndService(config),
  ].join('')
}

export async function createDockerCompose(config) {
  info('Building docker-compose file...')
  const file = buildDockerCompose(config)

  const networkPath = getFullNetworkPath(config)
  const qdata = joinPath(networkPath, 'qdata')

  if (isCakeshop(config.network.cakeshop)) {
    buildCakeshopDir(config, qdata)
  }

  info('Writing start script...')
  const startCommands = `#!/bin/bash
docker-compose up -d`
  const stopCommand = `#!/bin/bash
docker-compose down`

  writeFile(joinPath(networkPath, 'docker-compose.yml'), file, false)
  writeFile(joinPath(networkPath, '.env'), createEnvFile(config, isTessera(config.network.transactionManager)), false)
  if (config.network.txGenerate) {
    copyFile(joinPath(libRootDir(), 'lib', 'start-with-txns.sh'), joinPath(networkPath, 'start.sh'))
  } else {
    writeFile(joinPath(networkPath, 'start.sh'), startCommands, true)
  }
  writeFile(joinPath(networkPath, 'stop.sh'), stopCommand, true)
  info('Done')
}

function createEnvFile(config, hasTessera) {
  let env = `QUORUM_CONSENSUS=${config.network.consensus}
QUORUM_DOCKER_IMAGE=quorumengineering/quorum:${config.network.quorumVersion}
QUORUM_P2P_PORT=${config.containerPorts.quorum.p2pPort}
QUORUM_RAFT_PORT=${config.containerPorts.quorum.raftPort}
QUORUM_RPC_PORT=${config.containerPorts.quorum.rpcPort}
QUORUM_WS_PORT=${config.containerPorts.quorum.wsPort}
DOCKER_IP=${buildDockerIp(config.containerPorts.dockerSubnet, '10')}`
  if (hasTessera) {
    env = env.concat(`
QUORUM_TX_MANAGER_DOCKER_IMAGE=quorumengineering/tessera:${config.network.transactionManager}
TESSERA_P2P_PORT=${config.containerPorts.tm.p2pPort}
TESSERA_3PARTY_PORT=${config.containerPorts.tm.thirdPartyPort}`)
  }
  if (isQuorum260Plus(config.network.quorumVersion)) {
    env = env.concat(`
QUORUM_GETH_ARGS="--allow-insecure-unlock --graphql --graphql.port ${config.containerPorts.quorum.graphQlPort} --graphql.corsdomain=* --graphql.addr=0.0.0.0"`)
  }
  return env
}

function buildNodeService(config, node, i, hasTessera, hasSplunk, txGenerate) {
  const networkName = config.network.name
  const txManager = hasTessera
    ? `depends_on:
      - txmanager${i + 1}
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc`
    : `environment:
      - PRIVATE_CONFIG=ignore`
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``

  return `
  node${i + 1}:
    << : *quorum-def
    container_name: node${i + 1}
    hostname: node${i + 1}
    ports:
      - "${node.quorum.rpcPort}:${config.containerPorts.quorum.rpcPort}"
      - "${node.quorum.wsPort}:${config.containerPorts.quorum.wsPort}"
      - "${node.quorum.graphQlPort}:${config.containerPorts.quorum.graphQlPort}"
    volumes:
      - ${networkName}-vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    ${txManager}
      - NODE_ID=${i + 1}
    networks:
      ${networkName}-net:
        ipv4_address: ${node.quorum.ip}
    ${splunkLogging}`
}

function buildTesseraService(config, node, i, hasSplunk) {
  const networkName = config.network.name
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    container_name: txmanager${i + 1}
    hostname: txmanager${i + 1}
    ports:
      - "${node.tm.thirdPartyPort}:${config.containerPorts.tm.thirdPartyPort}"
    volumes:
      - ${networkName}-vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    networks:
      ${networkName}-net:
        ipv4_address: ${node.tm.ip}
    environment:
      - NODE_ID=${i + 1}
    ${splunkLogging}`
}

function buildCakeshopService(config, hasSplunk) {
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  const networkName = config.network.name
  return `
  cakeshop:
    << : *cakeshop-def
    container_name: cakeshop
    hostname: cakeshop
    ports:
      - "${config.network.cakeshopPort}:8999"
    volumes:
      - ${networkName}-cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      ${networkName}-net:
        ipv4_address: ${cidrhost(config.containerPorts.dockerSubnet, 2)}
    ${splunkLogging}`
}

function buildSplunkService(config, txGenerate) {
  const networkName = config.network.name
  const dependsOn = txGenerate
    ? `depends_on:
      - tx-gen` : ``
  return `
  splunk:
    << : *splunk-def
    container_name: splunk
    hostname: splunk
    ports:
      - "${config.network.splunkPort}:8000"
      - "8088:8088"
    volumes:
      - splunk-var:/opt/splunk/var
      - splunk-etc:/opt/splunk/etc
      - ./out/config/splunk/splunk-config.yml:/tmp/defaults/default.yml
      - ./out/config/splunk/dashboards:/dashboards
    networks:
      ${networkName}-net:
        ipv4_address: ${config.network.splunkIp}
    ${dependsOn}`
}

function buildCadvisorDefinition(config) {
  return `
x-cadvisor-def:
  &cadvisor-def
  image: google/cadvisor:latest
  command:
    - --storage_driver=statsd
    - --storage_driver_host=${config.network.splunkIp}:8125
    - --docker_only=true
  depends_on:
    - splunk
  user: root`
}

function buildCadvisorService(config) {
  const networkName = config.network.name
  return `
  cadvisor:
    << : *cadvisor-def
    container_name: cadvisor
    hostname: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - ${networkName}-net
    logging: *default-logging`
}

function buildEthloggerDefinitions(config) {
  let ethloggerDefs = ''
  config.nodes.forEach((node, i) => {
    ethloggerDefs += `
x-ethlogger${i+1}-def:
  &ethlogger${i+1}-def
  image: splunkdlt/ethlogger:latest
  environment:
    - ETH_RPC_URL=http://node${i+1}:${config.containerPorts.quorum.rpcPort}
    - NETWORK_NAME=quorum
    - START_AT_BLOCK=genesis
    - SPLUNK_HEC_URL=https://${config.network.splunkIp}:8088
    - SPLUNK_HEC_TOKEN=11111111-1111-1111-1111-1111111111113
    - SPLUNK_EVENTS_INDEX=ethereum
    - SPLUNK_METRICS_INDEX=metrics
    - SPLUNK_INTERNAL_INDEX=metrics
    - SPLUNK_HEC_REJECT_INVALID_CERTS=false
    - ABI_DIR=/app/abis
    - COLLECT_PENDING_TX=true
    - COLLECT_PEER_INFO=true
    - DEBUG=ethlogger:abi:*
  depends_on:
    - splunk
    - node${i+1}
  restart: unless-stopped`
  })
  return ethloggerDefs
}

function buildEthloggerService(config) {
  const networkName = config.network.name
  let ethloggers = ''

  config.nodes.forEach((node, i) => {
    ethloggers += `
  ethlogger${i+1}:
    << : *ethlogger${i+1}-def
    container_name: ethlogger${i+1}
    hostname: ethlogger${i+1}
    volumes:
      - ./out/config/splunk/abis:/app/abis:ro
      - ethlogger-state${i+1}:/app
    networks:
      - ${networkName}-net
    logging: *default-logging`
  })
  return ethloggers
}

function buildTxGenService(hasSplunk, config, pubkeys) {
  const networkName = config.network.name
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  let nodeVars = ''
  config.nodes.forEach((node, i) => {
    nodeVars += `
      - NODE${i + 1}=${node.quorum.ip}:${config.containerPorts.quorum.wsPort}`
  });
  let pubkeyVars = ''
  pubkeys.forEach((pubkey, i) => {
    pubkeyVars += `
      - PUBKEY${i + 1}=${pubkey}`
  });

  return `
  tx-gen:
    << : *tx-gen-def
    container_name: txgen
    environment:
      - QUORUM=true${nodeVars}${pubkeyVars}
    volumes:
      - ./out/config/contracts:/txgen/contracts
      - ./out/config/splunk/abis:/txgen/build/contracts
      - ./out/config/splunk/contract_config.json:/txgen/contract_config.json
    networks:
      - ${networkName}-net
    ${splunkLogging}`
}

function buildEndService(config) {
  const networkName = config.network.name
  return `
networks:
  ${networkName}-net:
    name: ${networkName}-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: ${config.containerPorts.dockerSubnet}
volumes:
${config.nodes.map((_, i) => `  "ethlogger-state${i + 1}":`).join('\n')}
${config.nodes.map((_, i) => `  "${networkName}-vol${i + 1}":`).join('\n')}
  "${networkName}-cakeshopvol":
  "splunk-var":
  "splunk-etc":`
}
