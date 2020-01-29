import { join, normalize } from 'path'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  readFileToString,
  removeFolder,
  writeFile,
  writeJsonFile,
  formatNewLine,
  cwd,
} from './fileUtils'
import { isTessera, includeCakeshop, createDirectory } from './networkCreator'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { buildCakeshopDir } from './cakeshopHelper'
const yaml = require('js-yaml')

export function buildDockerCompose(config) {
  const hasTessera = isTessera(config)
  const hasCakeshop = includeCakeshop(config)

  const quorumDefinitions = readFileToString(join(cwd(), 'lib/docker-compose-definitions-quorum.yml'))
  const tesseraDefinitions = hasTessera ? readFileToString(join(cwd(), 'lib/docker-compose-definitions-tessera.yml')) : ""
  const cakeshopDefinitions = hasCakeshop ? readFileToString(join(cwd(), 'lib/docker-compose-definitions-cakeshop.yml')) : ""

  let services = config.nodes.map((node, i) => {
    let allServices = buildNodeService(node, i, hasTessera)
    if(hasTessera) {
      allServices = [allServices, buildTesseraService(node, i)].join("")
    }
    return allServices
  })
  if(hasCakeshop) {
    services = [services.join(""), buildCakeshopService(config)]
  }
  return [formatNewLine(quorumDefinitions), formatNewLine(tesseraDefinitions), formatNewLine(cakeshopDefinitions), "services:", services.join(""), buildEndService(config)].join("")
}

export function createDockerCompose(config) {
  const file = buildDockerCompose(config)

  const commands = createDirectory(config)
  const networkPath = commands.netPath
  const qdata = join(networkPath, 'qdata')

  if(includeCakeshop(config)) {
    buildCakeshopDir(config, qdata)
  }

  let startCommands = `QUORUM_CONSENSUS=${config.network.consensus} docker-compose up -d`

  writeFile(join(networkPath, 'docker-compose.yml'), file, false)
  writeFile(join(networkPath, 'start.sh'), startCommands, true)
  writeFile(join(networkPath, 'stop.sh'), 'docker-compose down', true)

  copyFile(join(cwd(), 'lib/runscript.sh'), join(qdata, 'runscript.sh'))
  copyFile(join(cwd(), 'lib/public-contract.js'), join(qdata, 'public-contract.js'))
  copyFile(join(cwd(), 'lib/private-contract.js'), join(qdata, 'private-contract.js'))

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

function buildTesseraService(node, i) {
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    hostname: txmanager${i + 1}
    ports:
      - "${node.tm.thirdPartyPort}:9080"
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
