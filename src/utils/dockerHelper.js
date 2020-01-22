import { join, normalize } from 'path'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  readFileToString,
  removeFolder,
  writeFile,
  writeJsonFile
} from './fileUtils'
import { isTessera, createDirectory } from './networkCreator'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
const yaml = require('js-yaml')

export function buildDockerComposeWithTessera (config) {
  const definitions = readFileToString(join(process.cwd(), 'lib/docker-compose-definitions-tessera.yml'))
  let services = config.nodes.map((node, i) =>
    [buildNodeService(node, i, true), buildTesseraService(node, i)].join(""))

  return [definitions, services.join(""), buildEndService(config)].join("")
}

export function buildDockerComposeNoTessera (config) {
  const definitions = readFileToString(join(process.cwd(), 'lib/docker-compose-definitions.yml'))

  let services = config.nodes.map((node, i) =>
    buildNodeService(node, i, false))

  return [definitions, services.join(""), buildEndService(config)].join("")
}

export function createDockerCompose(config) {
  const file = isTessera(config) ?
    buildDockerComposeWithTessera(config) : buildDockerComposeNoTessera(config)

  const commands = createDirectory(config)
  const networkPath = commands.netPath
  const qdata = join(networkPath, 'qdata')

  let startCommands = `QUORUM_CONSENSUS=${config.network.consensus} docker-compose up -d`

  writeFile(join(networkPath, 'docker-compose.yml'), file, false)
  writeFile(join(networkPath, 'start.sh'), startCommands, true)
  writeFile(join(networkPath, 'stop.sh'), 'docker-compose down', true)

  copyFile(join(process.cwd(), 'lib/runscript.sh'), join(qdata, 'runscript.sh'))
  copyFile(join(process.cwd(), 'lib/public-contract.js'), join(qdata, 'public-contract.js'))
  copyFile(join(process.cwd(), 'lib/private-contract.js'), join(qdata, 'private-contract.js'))

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

function buildEndService(config) {
  return `
#  cakeshop:
#    << : *cakeshop-def
#    hostname: cakeshop
#    ports:
#      - "8999:8999"
#    volumes:
#      - cakeshopvol:/qdata
#      - ./qdata:/examples:ro
#    networks:
#      quorum-examples-net:
#        ipv4_address: 172.16.239.186
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
