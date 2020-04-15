import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  cwd,
  libRootDir,
  readFileToString,
  removeFolder,
  writeJsonFile,
} from '../utils/fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'
import {
  isRaft,
  isTessera,
} from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'

export function createNetwork(config) {
  const networkPath = getFullNetworkPath(config)
  removeFolder(networkPath)
  createFolder(networkPath, true)
  writeJsonFile(networkPath, 'config.json', config)
  return networkPath
}

export function createDirectory(config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/

  const networkPath = createNetwork(config)

  const qdata = joinPath(networkPath, 'qdata')
  const logs = joinPath(qdata, 'logs')
  createFolder(logs, true)

  const configPath = joinPath(cwd(), config.network.configDir)
  createFolder(configPath, true)
  let keyPath = joinPath(libRootDir(), '7nodes')
  // if user selected to generate keys
  if (config.network.generateKeys) {
    keyPath = generateKeys(config, configPath)
  }
  // always generate consensus genesis
  generateConsensusConfig(
    configPath,
    keyPath,
    config.network.consensus,
    config.nodes,
    config.network.networkId,
  )

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus, keyPath)
  const peerList = createPeerList(config.nodes, config.network.transactionManager)

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = joinPath(keyPath, `key${nodeNumber}`)
    const quorumDir = joinPath(qdata, `dd${nodeNumber}`)
    const gethDir = joinPath(quorumDir, 'geth')
    const keyDir = joinPath(quorumDir, 'keystore')
    const tmDir = joinPath(qdata, `c${nodeNumber}`)
    const passwordDestination = joinPath(keyDir, 'password.txt')
    const genesisDestination = joinPath(quorumDir, 'genesis.json')
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)


    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(joinPath(keyFolder, 'key'), joinPath(keyDir, 'key'))
    copyFile(joinPath(keyFolder, 'nodekey'), joinPath(gethDir, 'nodekey'))
    copyFile(joinPath(keyFolder, 'password.txt'), passwordDestination)
    copyFile(joinPath(configPath, 'genesis.json'), genesisDestination)
    if (isTessera(config.network.transactionManager)) {
      copyFile(joinPath(keyFolder, 'tm.key'), joinPath(tmDir, 'tm.key'))
      copyFile(joinPath(keyFolder, 'tm.pub'), joinPath(tmDir, 'tm.pub'))
      const tesseraConfig = createConfig(
        tmDir,
        nodeNumber,
        node.tm.ip,
        node.tm.thirdPartyPort,
        node.tm.p2pPort,
        peerList,
      )
      writeJsonFile(tmDir, `tessera-config-09-${nodeNumber}.json`, tesseraConfig)
    }
  })
}

export function createStaticNodes(nodes, consensus, configDir) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `${configDir}/key${nodeNumber}`
    const enodeId = readFileToString(joinPath(generatedKeyFolder, 'enode'))

    let enodeAddress = `enode://${enodeId}@${node.quorum.ip}:${node.quorum.devP2pPort}?discport=0`
    if (isRaft(consensus)) {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}

function createPeerList(nodes, transactionManager) {
  if (!isTessera(transactionManager)) {
    return []
  }
  return nodes.map((node) => ({ url: `http://${node.tm.ip}:${node.tm.p2pPort}` }))
}

export function getFullNetworkPath(config) {
  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  return joinPath(cwd(), 'network', networkFolderName)
}
