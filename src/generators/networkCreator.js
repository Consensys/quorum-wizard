import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  cwd,
  libRootDir,
  readFileToString,
  removeFolder,
  writeJsonFile,
  copyDirectory,
  writeFile,
} from '../utils/fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'
import { buildKubernetesResource } from '../model/ResourceConfig'
import {
  isRaft,
  isTessera,
  isDocker,
  isKubernetes,
  isBash,
  isSplunk,
} from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'
import { executeSync } from '../utils/execUtils'
import { info } from '../utils/log'

export function createNetwork(config) {
  info('Building network directory...')
  const networkPath = getFullNetworkPath(config)
  removeFolder(networkPath)
  createFolder(networkPath, true)
  writeJsonFile(networkPath, 'config.json', config)
}

export function generateResourcesRemote(config) {
  info('Generating network resources in docker container...')
  const configDir = joinPath(cwd(), config.network.configDir)
  const networkPath = getFullNetworkPath(config)
  const remoteOutputDir = joinPath(networkPath, 'out', 'config')

  const file = buildKubernetesResource(config)
  writeFile(joinPath(networkPath, 'qubernetes.yaml'), file, false)

  if (!config.network.generateKeys) {
    createFolder(remoteOutputDir, true)
    copyDirectory(joinPath(libRootDir(), '7nodes'), remoteOutputDir)
  }

  const initScript = isKubernetes(config.network.deployment) ? 'qube-init' : 'quorum-init'
  let dockerCommand = `cd ${networkPath}
  ## make sure docker is installed
  docker ps > /dev/null
  EXIT_CODE=$?

  if [[ EXIT_CODE -ne 0 ]];
  then
    exit $EXIT_CODE
  fi
  docker pull quorumengineering/qubernetes:latest

  docker run -v ${networkPath}/qubernetes.yaml:/qubernetes/qubernetes.yaml -v ${networkPath}/out:/qubernetes/out  quorumengineering/qubernetes ./${initScript} --action=update qubernetes.yaml 2>&1
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `

  if (isDocker(config.network.deployment)) {
    dockerCommand += `
    sed -i '' 's/%QUORUM-NODE\\([0-9]\\)_SERVICE_HOST%/172.16.239.1\\1/g' ${networkPath}/out/config/permissioned-nodes.json`
  }
  if (isSplunk(config.network.splunk)) {
    copyDirectory(joinPath(libRootDir(), 'splunk'), joinPath(remoteOutputDir, 'splunk'))
  }

  if (config.network.txGenerate) {
    copyDirectory(joinPath(libRootDir(), 'lib', 'scripts'), joinPath(remoteOutputDir, 'scripts'))
    // copyFile(joinPath(networkPath, 'private_contract.js'), joinPath(remoteOutputDir, 'scripts', 'private_contract.js'))
  }

  try {
    executeSync(dockerCommand)
  } catch (e) {
    throw new Error('Remote generation failed')
  }
  if (isDocker(config.network.deployment)) {
    copyDirectory(remoteOutputDir, configDir)
  }
}

export async function generateResourcesLocally(config) {
  info('Generating network resources locally...')
  const configDir = joinPath(cwd(), config.network.configDir)
  createFolder(configDir, true)

  if (config.network.generateKeys) {
    await generateKeys(config, configDir)
  } else {
    copyDirectory(joinPath(libRootDir(), '7nodes'), configDir)
  }

  if (isSplunk(config.network.splunk)) {
    copyDirectory(joinPath(libRootDir(), 'splunk'), joinPath(configDir, 'splunk'))
  }

  if (config.network.txGenerate) {
    copyDirectory(joinPath(libRootDir(), 'lib', 'scripts'), joinPath(configDir, 'scripts'))
    copyFile(joinPath(networkPath, 'private_contract.js'), joinPath(configDir, 'scripts', 'private_contract.js'))
  }

  generateConsensusConfig(
    configDir,
    config.network.consensus,
    config.nodes,
    config.network.networkId,
  )

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus, configDir)
  writeJsonFile(configDir, 'permissioned-nodes.json', staticNodes)
}

export function createQdataDirectory(config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/
  info('Building qdata directory...')
  const networkPath = getFullNetworkPath(config)
  const qdata = joinPath(networkPath, 'qdata')
  const logs = joinPath(qdata, 'logs')
  createFolder(logs, true)

  const configPath = joinPath(cwd(), config.network.configDir)

  const peerList = createPeerList(config.nodes, config.network.transactionManager)

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keySource = joinPath(configPath, `key${nodeNumber}`)
    const quorumDir = joinPath(qdata, `dd${nodeNumber}`)
    const gethDir = joinPath(quorumDir, 'geth')
    const keyDir = joinPath(quorumDir, 'keystore')
    const tmDir = joinPath(qdata, `c${nodeNumber}`)
    const passwordDestination = joinPath(keyDir, 'password.txt')
    const genesisDestination = joinPath(quorumDir, 'genesis.json')
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)

    copyFile(joinPath(configPath, 'permissioned-nodes.json'), joinPath(quorumDir, 'permissioned-nodes.json'))
    copyFile(joinPath(configPath, 'permissioned-nodes.json'), joinPath(quorumDir, 'static-nodes.json'))
    copyFile(joinPath(keySource, 'key'), joinPath(keyDir, 'key'))
    copyFile(joinPath(keySource, 'nodekey'), joinPath(gethDir, 'nodekey'))
    copyFile(joinPath(keySource, 'password.txt'), passwordDestination)
    copyFile(joinPath(configPath, 'genesis.json'), genesisDestination)
    if (isTessera(config.network.transactionManager)) {
      createFolder(tmDir)
      copyFile(joinPath(keySource, 'tm.key'), joinPath(tmDir, 'tm.key'))
      copyFile(joinPath(keySource, 'tm.pub'), joinPath(tmDir, 'tm.pub'))

      if (isBash(config.network.deployment)) {
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
