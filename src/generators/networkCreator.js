import { join } from 'path'
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

export function createDirectory(config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/

  const networkPath = getFullNetworkPath(config)
  removeFolder(networkPath)

  const qdata = join(networkPath, 'qdata')
  const logs = join(qdata, 'logs')
  createFolder(logs, true)
  writeJsonFile(networkPath, 'config.json', config)

  const configPath = join(cwd(), config.network.configDir)
  createFolder(configPath, true)
  let keyPath = join(libRootDir(), '7nodes')
  // if user selected to generate keys
  if (config.network.generateKeys) {
    generateKeys(config, configPath)
    keyPath = configPath
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
    const keyFolder = join(keyPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, 'geth')
    const keyDir = join(quorumDir, 'keystore')
    const tmDir = join(qdata, `c${nodeNumber}`)
    const passwordDestination = join(keyDir, 'password.txt')
    const genesisDestination = join(quorumDir, 'genesis.json')
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)

    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(join(keyFolder, 'key'), join(keyDir, 'key'))
    copyFile(join(keyFolder, 'nodekey'), join(gethDir, 'nodekey'))
    copyFile(join(keyFolder, 'password.txt'), passwordDestination)
    copyFile(join(configPath, 'genesis.json'), genesisDestination)
    if (isTessera(config.network.transactionManager)) {
      copyFile(join(keyFolder, 'tm.key'), join(tmDir, 'tm.key'))
      copyFile(join(keyFolder, 'tm.pub'), join(tmDir, 'tm.pub'))
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
    const enodeId = readFileToString(join(generatedKeyFolder, 'enode'))

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

  return join(cwd(), 'network', networkFolderName)
}
