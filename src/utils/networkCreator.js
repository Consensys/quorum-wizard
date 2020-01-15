import { join, normalize } from 'path'
import { execute } from './execUtils'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  readFileToString,
  removeFolder,
  writeFile,
  writeJsonFile,
} from './fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'
import { isBash } from '../model/NetworkConfig'
import { createGethStartCommand, createTesseraStartCommand, waitForTesseraNodesCommand } from './bashHelper'

export function createDirectory (config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/

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
  const peerList = createPeerList(config.nodes, config.network.transactionManager)
  const initCommands = []
  const startCommands = []
  const tmStartCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = join(configPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, 'geth')
    const keyDir = join(quorumDir, 'keystore')
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
      let tesseraConfig = createConfig(tmDir, nodeNumber,
        node.tm.thirdPartyPort, node.tm.p2pPort, peerList)
      writeJsonFile(tmDir, `tessera-config-09-${nodeNumber}.json`,
        tesseraConfig)
    }

    if (config.network.deployment === 'bash') {
      const initCommand = `cd ${networkPath} && geth --datadir ${quorumDir} init ${genesisDestination}`
      initCommands.push(initCommand)

      let tmIpcLocation = isTessera(config) ? join(tmDir, 'tm.ipc') : 'ignore'
      const startCommand = createGethStartCommand(config, node,
        passwordDestination, nodeNumber, tmIpcLocation)
        startCommands.push(startCommand)

      if (isTessera(config)) {
        const tmStartCommand = createTesseraStartCommand(config, node, nodeNumber,
          tmDir, logs)
        tmStartCommands.push(tmStartCommand)
      }
    }
  })

  var obj = {
    tesseraStart:  tmStartCommands.join('\n'),
    gethStart: startCommands.join('\n'),
    initStart: initCommands,
    netPath: networkPath,
  }
  return obj;
}

export function createStaticNodes (nodes, consensus, configDir) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `${configDir}/key${nodeNumber}`
    const enodeId = readFileToString(join(generatedKeyFolder, 'enode'))

    let enodeAddress = `enode://${enodeId}@${node.quorum.ip}:${node.quorum.devP2pPort}?discport=0`
    if (consensus === 'raft') {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}

export function isTessera (config) {
  return config.network.transactionManager === 'tessera'
}

function createPeerList (nodes, transactionManager) {
  if (transactionManager !== 'tessera') {
    return []
  }
  return nodes.map((node) => ({
    url: `http://${node.tm.ip}:${node.tm.p2pPort}`
  }))
}
