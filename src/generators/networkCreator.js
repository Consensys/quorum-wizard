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
  readDir,
  readJsonFile,
} from '../utils/fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'
import {
  buildKubernetesResource,
  LATEST_QUBERNETES,
} from '../model/ResourceConfig'
import {
  isRaft,
  isTessera,
  isDocker,
  isKubernetes,
  isBash,
} from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'
import { executeSync } from '../utils/execUtils'
import { info } from '../utils/log'
import { buildDockerIp } from '../utils/subnetUtils'

export function createNetwork(config) {
  info('Building network directory...')
  const networkPath = getFullNetworkPath(config)
  removeFolder(networkPath)
  createFolder(networkPath, true)
  const configPath = getConfigPath()
  createFolder(configPath, true)
  writeJsonFile(configPath, `${config.network.name}-config.json`, config)
}

export function generateResourcesRemote(config) {
  info('Pulling docker container and generating network resources...')
  const configDir = joinPath(cwd(), config.network.configDir)
  const networkPath = getFullNetworkPath(config)
  const remoteOutputDir = joinPath(networkPath, 'out', 'config')

  const file = buildKubernetesResource(config)
  writeFile(joinPath(networkPath, 'qubernetes.yaml'), file, false)

  const initScript = isKubernetes(config.network.deployment) ? 'qube-init' : 'quorum-init'
  const copy7nodes = !config.network.generateKeys ? 'cp -r /qubernetes/7nodes /qubernetes/out/config; ' : ''
  let dockerCommand = `cd ${networkPath}
  ## make sure docker is installed
  docker ps > /dev/null
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ];
  then
    exit $EXIT_CODE
  fi

  docker pull quorumengineering/qubernetes:${LATEST_QUBERNETES}


  docker run --rm -v ${networkPath}/qubernetes.yaml:/qubernetes/qubernetes.yaml -v ${networkPath}/out:/qubernetes/out quorumengineering/qubernetes:${LATEST_QUBERNETES} /bin/bash -c "${copy7nodes}./${initScript} --action=update qubernetes.yaml"
  `

  if (isDocker(config.network.deployment)) {
    dockerCommand += `
    sed -i'.bak' 's/%QUORUM-NODE\\([0-9]\\)_SERVICE_HOST%/${buildDockerIp(config.containerPorts.dockerSubnet, '1')}\\1/g' ${networkPath}/out/config/permissioned-nodes.json`
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
    copyFile(joinPath(keySource, 'acctkeyfile.json'), joinPath(keyDir, 'key'))
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
      } else {
        copyFile(joinPath(configPath, 'tessera-config-9.0.json'), joinPath(tmDir, 'tessera-config-09.json'))
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

function getConfigPath(...relativePaths) {
  return joinPath(cwd(), 'configs', ...relativePaths)
}

export function readConfigJson(...relativePaths) {
  return readJsonFile(getConfigPath(...relativePaths))
}
export function getAvailableConfigs() {
  const configDir = getConfigPath()
  const arr = readDir(configDir)
  return (arr && arr.length) ? arr : ['no configs available']
}
