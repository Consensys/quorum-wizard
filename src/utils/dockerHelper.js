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
import { isTessera, createStaticNodes } from './networkCreator'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'

export function buildDockerComposeWithTessera (config) {
  const definitions = readFileToString(join(process.cwd(), 'lib/docker-compose-definitions-tessera.yml'))

  let services = config.nodes.map((node, i) =>`
  node${i + 1}:
    << : *quorum-def
    hostname: node${i + 1}
    ports:
      - "${node.quorum.rpcPort}:8545"
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    depends_on:
      - txmanager${i + 1}
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc
      - NODE_ID=${i + 1}
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.1${i + 1}
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
      - NODE_ID=${i + 1}`).join("")
  const end = `
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

  return [definitions, services, end].join("")
}

export function buildDockerComposeNoTessera (config) {
  const definitions = readFileToString(join(process.cwd(), 'lib/docker-compose-definitions.yml'))

  let services = config.nodes.map((node, i) =>`
  node${i + 1}:
    << : *quorum-def
    hostname: node${i + 1}
    ports:
      - "${node.quorum.rpcPort}:8545"
    volumes:
      - vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    environment:
      - PRIVATE_CONFIG=ignore
      - NODE_ID=${i + 1}
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.1${i + 1}`).join("")
  const end = `
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

  return [definitions, services, end].join("")
}

export function createDockerCompose(config) {
  const file = isTessera(config) ?
    buildDockerComposeWithTessera(config) : buildDockerComposeNoTessera(config)

  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  const networkPath = join(process.cwd(), 'network', networkFolderName)
  removeFolder(networkPath)

  const qdata = join(networkPath, 'qdata')
  const logs = join(qdata, 'logs')
  createFolder(logs, true)
  writeJsonFile(networkPath, 'config.json', config)

  const configPath = join(process.cwd(), config.network.configDir)
  if(config.network.generateKeys) {
      generateKeys(config, configPath)
      generateConsensusConfig(configPath, config.network.consensus, config.nodes)
  }

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus, config.network.configDir)

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = join(configPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, `geth`)
    const keyDir = join(quorumDir, `keystore`)
    const tmDir = join(qdata, `c${nodeNumber}`)
    const passwordDestination = join(keyDir, 'password.txt')
    const genesisDestination = join(quorumDir, `${config.network.consensus}-genesis.json`)
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)

    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(normalize(config.network.genesisFile), genesisDestination)
    copyFile(join(keyFolder, 'key'), join(keyDir, 'key'))
    copyFile(join(keyFolder, 'nodekey'), join(gethDir, 'nodekey'))
    copyFile(join(keyFolder, 'password.txt'), passwordDestination)
    copyFile(join(configPath, `${config.network.consensus}-genesis.json`), genesisDestination)
    if(isTessera(config)) {
      copyFile(join(keyFolder, 'tm.key'), join(tmDir, 'tm.key'))
      copyFile(join(keyFolder, 'tm.pub'), join(tmDir, 'tm.pub'))
    }
  })

  let startCommands = `QUORUM_CONSENSUS=${config.network.consensus} docker-compose up -d`

  writeFile(join(networkPath, 'docker-compose.yml'), file, false)
  writeFile(join(networkPath, 'start.sh'), startCommands, true)
  writeFile(join(networkPath, 'stop.sh'), 'docker-compose down', true)
  //copyFile(join(process.cwd(), 'lib/dockerStop.sh'), join(networkPath, 'stop.sh'))

}
