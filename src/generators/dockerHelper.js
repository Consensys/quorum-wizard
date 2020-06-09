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
  isQuorum260Plus,
} from '../model/NetworkConfig'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

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
      buildSplunkService(config.network.splunkPort, txGenerate),
      buildEthloggerService(),
      buildCadvisorService()]
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

  writeFile(joinPath(networkPath, 'docker-compose.yml'), file, false)
  writeFile(joinPath(networkPath, '.env'), createEnvFile(config, isTessera(config.network.transactionManager)), false)

  info('Writing start script...')
  if (config.network.txGenerate) {
    copyFile(joinPath(libRootDir(), 'lib', 'start-with-txns.sh'), joinPath(networkPath, 'start.sh'))
  } else {
    writeFile(joinPath(networkPath, 'start.sh'), 'docker-compose up -d', true)
  }
  writeFile(joinPath(networkPath, 'stop.sh'), 'docker-compose down', true)
  info('Done')
}

function createEnvFile(config, hasTessera) {
  let env = `QUORUM_CONSENSUS=${config.network.consensus}
QUORUM_DOCKER_IMAGE=quorumengineering/quorum:${config.network.quorumVersion}
QUORUM_P2P_PORT=${config.containerPorts.quorum.p2pPort}
QUORUM_RAFT_PORT=${config.containerPorts.quorum.raftPort}
QUORUM_RPC_PORT=${config.containerPorts.quorum.rpcPort}
QUORUM_WS_PORT=${config.containerPorts.quorum.wsPort}`
  if (hasTessera) {
    env = env.concat(`
QUORUM_TX_MANAGER_DOCKER_IMAGE=quorumengineering/tessera:${config.network.transactionManager}
TESSERA_P2P_PORT=${config.containerPorts.tm.p2pPort}
TESSERA_3PARTY_PORT=${config.containerPorts.tm.thirdPartyPort}`)
  }
  if (isQuorum260Plus(config.network.quorumVersion)) {
    env = env.concat(`
QUORUM_GETH_ARGS="--allow-insecure-unlock"`)
  }
  return env
}

function buildNodeService(config, node, i, hasTessera, hasSplunk, txGenerate) {
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
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    ${txManager}
      - NODE_ID=${i + 1}
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.1${i + 1}
    ${splunkLogging}`
}

function buildTesseraService(config, node, i, hasSplunk) {
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    hostname: txmanager${i + 1}
    ports:
      - "${node.tm.thirdPartyPort}:${config.containerPorts.tm.thirdPartyPort}"
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.10${i + 1}
    environment:
      - NODE_ID=${i + 1}
    ${splunkLogging}`
}

function buildCakeshopService(port, hasSplunk) {
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  return `
  cakeshop:
    << : *cakeshop-def
    hostname: cakeshop
    ports:
      - "${port}:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.186
    ${splunkLogging}`
}

function buildSplunkService(port, txGenerate) {
  const dependsOn = txGenerate
    ? `depends_on:
      - tx-gen` : ``
  return `
  splunk:
    << : *splunk-def
    container_name: splunk
    hostname: splunk
    ports:
      - "${port}:8000"
      - "8088:8088"
    volumes:
      - splunk-var:/opt/splunk/var
      - splunk-etc:/opt/splunk/etc
      - ./out/config/splunk/splunk-config.yml:/tmp/defaults/default.yml
      - ./out/config/splunk/dashboards:/dashboards
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.200
    ${dependsOn}`
}

function buildCadvisorService() {
  return `
  cadvisor:
    << : *cadvisor-def
    hostname: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - quorum-examples-net
    logging: *default-logging`
}

function buildEthloggerService() {
  return `
  ethlogger:
    << : *ethlogger-def
    hostname: ethlogger
    volumes:
      - ./out/config/splunk/abis:/app/abis
      - ./out/config/splunk:/app
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.202
    logging: *default-logging`
}

function buildTxGenService(hasSplunk, config, pubkeys) {
  const splunkLogging = hasSplunk
    ? `logging: *default-logging` : ``
  let nodeVars = ''
  config.nodes.forEach((node, i) => {
    nodeVars += `
      - NODE${i + 1}=172.16.239.1${i + 1}:${config.containerPorts.quorum.wsPort}`
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
    networks:
      - quorum-examples-net
    ${splunkLogging}`
}

function buildEndService(config) {
  return `
networks:
  quorum-examples-net:
    name: quorum-examples-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
${config.nodes.map((_, i) => `  "vol${i + 1}":`).join('\n')}
  "cakeshopvol":
  "splunk-var":
  "splunk-etc":`
}
