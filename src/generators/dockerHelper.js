import { join } from 'path'
import {
  copyFile,
  readFileToString,
  writeFile,
  formatNewLine,
  libRootDir,
} from '../utils/fileUtils'
import { getFullNetworkPath, includeCakeshop } from './networkCreator'
import { buildCakeshopDir } from './cakeshopHelper'
import { isTessera } from '../model/NetworkConfig'
import { downloadAndCopyBinaries } from './binaryHelper'
const yaml = require('js-yaml')

export function buildDockerCompose(config) {
  const hasTessera = isTessera(config.network.transactionManager)
  const hasCakeshop = includeCakeshop(config)

  const quorumDefinitions = readFileToString(join(libRootDir(), 'lib/docker-compose-definitions-quorum.yml'))
  const quorumExposedPorts = createCustomQuorumPorts(config.dockerCustom)
  const tesseraDefinitions = hasTessera ? readFileToString(join(libRootDir(), 'lib/docker-compose-definitions-tessera.yml')) : ""
  const tesseraExposedPorts = hasTessera ? createCustomTesseraPorts(config.dockerCustom) : ""
  const cakeshopDefinitions = hasCakeshop ? readFileToString(join(libRootDir(), 'lib/docker-compose-definitions-cakeshop.yml')) : ""

  let services = config.nodes.map((node, i) => {
    let allServices = buildNodeService(node, i, hasTessera)
    if(hasTessera) {
      allServices = [allServices, buildTesseraService(node, i, config.dockerCustom)].join("")
    }
    return allServices
  })
  if(hasCakeshop) {
    services = [services.join(""), buildCakeshopService(config)]
  }

  return [formatNewLine(quorumDefinitions), formatNewLine(quorumExposedPorts), formatNewLine(tesseraDefinitions), formatNewLine(tesseraExposedPorts), formatNewLine(cakeshopDefinitions), "services:", services.join(""), buildEndService(config)].join("")
}

function createCustomQuorumPorts(dockerConfig) {
  if (dockerConfig === undefined){
    return `  expose:
    - "21000"
    - "50400"`
  } else {
    return `  expose:
    - "${dockerConfig.quorumRpcPort}"
    - "${dockerConfig.quorumRaftPort}"`
  }
}

function createCustomTesseraPorts(dockerConfig) {
  if (dockerConfig === undefined){
    return `  expose:
    - "9000"
    - "9080"`
  } else {
    return `  expose:
    - "${dockerConfig.tesseraP2pPort}"
    - "${dockerConfig.tesseraThirdPartyPort}"`
  }
}

export async function createDockerCompose(config) {
  console.log('Downloading dependencies...')
  await downloadAndCopyBinaries(config)

  console.log('Building docker-compose file...')
  const file = buildDockerCompose(config)

  console.log('Downloading dependencies...')

  const networkPath = getFullNetworkPath(config)
  const qdata = join(networkPath, 'qdata')

  if(includeCakeshop(config)) {
    buildCakeshopDir(config, qdata)
  }

  console.log('Writing start script...')
  let startCommands = `QUORUM_CONSENSUS=${config.network.consensus} docker-compose up -d`

  writeFile(join(networkPath, 'docker-compose.yml'), file, false)
  writeFile(join(networkPath, 'start.sh'), startCommands, true)
  writeFile(join(networkPath, 'stop.sh'), 'docker-compose down', true)
}

function buildNodeService(node, i, hasTessera) {
  const txManager = hasTessera ?
    `depends_on:
      - txmanager${i + 1}
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc` :
    `environment:
      - PRIVATE_CONFIG=ignore`

  return `
  node${i + 1}:
    << : *quorum-def
    hostname: node${i + 1}
    ports:
      - "${node.quorum.rpcPort}:8545"
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    ${txManager}
      - NODE_ID=${i + 1}
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.1${i + 1}`
}

function buildTesseraService(node, i, docker) {
  const port = docker === undefined ? '9080' : docker.tesseraThirdPartyPort
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    hostname: txmanager${i + 1}
    ports:
      - "${node.tm.thirdPartyPort}:${port}"
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.10${i + 1}
    environment:
      - NODE_ID=${i + 1}`
}

function buildCakeshopService(config) {
  return `
  cakeshop:
    << : *cakeshop-def
    hostname: cakeshop
    ports:
      - "8999:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.186`
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
${config.nodes.map((_, i) => `  "vol${i + 1}":`).join("\n")}
  "cakeshopvol":`
}
