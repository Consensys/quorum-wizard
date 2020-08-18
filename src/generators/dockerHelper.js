import {
  formatNewLine, libRootDir, readFileToString, writeFile,
} from '../utils/fileUtils'
import { getFullNetworkPath } from './networkHelper'
import { buildCakeshopDir } from './cakeshopHelper'
import { isCakeshop, isTessera } from '../model/NetworkConfig'
import { info } from '../utils/log'
import { joinPath, removeTrailingSlash } from '../utils/pathUtils'
import { buildDockerIp, cidrhost } from '../utils/subnetUtils'
import { isQuorum260Plus } from './binaryHelper'
import { buildSplunkDockerCompose, buildEthloggerService, buildCadvisorService } from './splunkHelper'

let DOCKER_REGISTRY

export function setDockerRegistry(registry) {
  if (!registry) {
    DOCKER_REGISTRY = ''
    return
  }

  if (registry.indexOf('http') === 0) {
    throw new Error('Docker registry url should NOT include http(s):// at the beginning')
  }

  // make sure that there is a trailing slash
  DOCKER_REGISTRY = `${removeTrailingSlash(registry)}/`

  info(`Using custom docker registry: ${DOCKER_REGISTRY}`)
}

export function getDockerRegistry() {
  return DOCKER_REGISTRY
}

export function buildDockerCompose(config) {
  const hasTessera = isTessera(config.network.transactionManager)
  const hasCakeshop = isCakeshop(config.network.cakeshop)
  const hasSplunk = config.network.splunk

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
    'lib/docker-compose-definitions-splunk-helpers.yml',
  )) : ''

  let services = config.nodes.map((node, i) => {
    let allServices = buildNodeService(config, node, i, hasTessera, hasSplunk)
    if (hasTessera) {
      allServices = [allServices, buildTesseraService(config, node, i, hasSplunk)].join('')
    }
    return allServices
  })
  if (hasCakeshop) {
    services = [services.join(''), buildCakeshopService(config, hasSplunk)]
  }
  if (hasSplunk) {
    services = [services.join(''),
      buildEthloggerService(config),
      buildCadvisorService(config)]
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

export async function initDockerCompose(config) {
  info('Building docker-compose file...')
  const file = buildDockerCompose(config)
  const hasSplunk = config.network.splunk
  const networkPath = getFullNetworkPath(config)
  const qdata = joinPath(networkPath, 'qdata')

  if (isCakeshop(config.network.cakeshop)) {
    buildCakeshopDir(config, qdata)
  }

  if (hasSplunk) {
    writeFile(joinPath(networkPath, 'docker-compose-splunk.yml'), buildSplunkDockerCompose(config), false)
  }
  writeFile(joinPath(networkPath, 'docker-compose.yml'), file, false)
  writeFile(joinPath(networkPath, '.env'), createEnvFile(config, isTessera(config.network.transactionManager)), false)
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
QUORUM_GETH_ARGS=--allow-insecure-unlock --graphql --graphql.port ${config.containerPorts.quorum.graphQlPort} --graphql.corsdomain=* --graphql.addr=0.0.0.0`)
  }
  if (getDockerRegistry() !== '') {
    env = env.concat(`
DOCKER_REGISTRY=${getDockerRegistry()}`)
  }
  return env
}

function buildNodeService(config, node, i, hasTessera, hasSplunk) {
  const networkName = config.network.name
  const txManager = hasTessera
    ? `depends_on:
      - txmanager${i + 1}
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc`
    : `environment:
      - PRIVATE_CONFIG=ignore`
  const splunkLogging = hasSplunk
    ? 'logging: *default-logging' : ''

  return `
  node${i + 1}:
    << : *quorum-def
    container_name: ${networkName}-node${i + 1}
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
    ? 'logging: *default-logging' : ''
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    container_name: ${networkName}-txmanager${i + 1}
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
    ? 'logging: *default-logging' : ''
  const networkName = config.network.name
  return `
  cakeshop:
    << : *cakeshop-def
    container_name: ${networkName}-cakeshop
    hostname: cakeshop
    ports:
      - "${config.network.cakeshopPort}:8999"
    volumes:
      - ${networkName}-cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      ${networkName}-net:
        ipv4_address: ${cidrhost(config.containerPorts.dockerSubnet, 75)}
    ${splunkLogging}`
}

function buildEndService(config) {
  const networkName = config.network.name
  const volumes = []
  config.nodes.forEach((_node, i) => {
    const nodeNumber = i + 1
    volumes.push(`  "${networkName}-vol${nodeNumber}":`)
    if (config.network.splunk) {
      volumes.push(`  "${networkName}-ethlogger-state${nodeNumber}":`)
    }
  })
  if (isCakeshop(config.network.cakeshop)) {
    volumes.push(`  "${networkName}-cakeshopvol":`)
  }
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
${volumes.join('\n')}`
}
