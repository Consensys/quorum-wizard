import {
  copyDirectory,
  copyFile,
  createFolder,
  libRootDir,
  readFileToString,
  removeFolder,
  writeFile,
  readDir,
  writeJsonFile,
  writeScript,
  getOutputPath,
} from '../utils/fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'
import { buildKubernetesResource, LATEST_QUBERNETES } from '../model/ResourceConfig'
import {
  isRaft,
  isTessera,
  isDocker,
  isKubernetes,
  isBash,
  CUSTOM_CONFIG_LOCATION,
} from '../model/NetworkConfig'
import { joinPath, unixifyPath } from '../utils/pathUtils'
import { executeSync } from '../utils/execUtils'
import { info, error } from '../utils/log'
import { buildDockerIp } from '../utils/subnetUtils'
import SCRIPTS from './scripts'
import { getDockerRegistry } from './dockerHelper'
import { getFullNetworkPath } from './networkHelper'

export function createNetwork(config) {
  info('Building network directory...')
  const networkPath = getFullNetworkPath(config)
  removeFolder(networkPath)
  createFolder(networkPath, true)
  const configPath = getConfigsPath()
  createFolder(configPath, true)
  writeJsonFile(configPath, `${config.network.name}-config.json`, config)
}

export function generateResourcesRemote(config) {
  info('Pulling docker container and generating network resources...')
  const configDir = getFullResourceConfigDir(config)
  const networkPath = getFullNetworkPath(config)
  const remoteOutputDir = joinPath(networkPath, 'out', 'config')

  const file = buildKubernetesResource(config)
  const qubernetesYamlPath = joinPath(networkPath, 'qubernetes.yaml')
  writeFile(qubernetesYamlPath, file, false)

  const initScript = isKubernetes(config.network.deployment) ? 'qube-init' : 'quorum-init'
  const copy7nodes = !config.network.generateKeys ? 'cp -r /qubernetes/7nodes /qubernetes/out/config; ' : ''
  const qubernetesImage = `${getDockerRegistry()}quorumengineering/qubernetes:${LATEST_QUBERNETES}`
  const outPath = joinPath(networkPath, 'out')
  const dockerCommands = [
    `cd ${networkPath}`,
    `docker pull ${qubernetesImage}`,
    // docker volumes using C:\folder\ style paths cause problems, convert to /c/folder/ on windows
    `docker run --rm -v ${unixifyPath(qubernetesYamlPath)}:/qubernetes/qubernetes.yaml -v ${unixifyPath(outPath)}:/qubernetes/out ${qubernetesImage} /bin/bash -c "${copy7nodes}./${initScript} --action=update qubernetes.yaml"`,
  ]

  try {
    dockerCommands.forEach(executeSync)
  } catch (e) {
    error('\nGenerating resources in Qubernetes Docker container failed.\nYou may not be able to access DockerHub from your machine.\nIf you have a custom docker registry, re-run the wizard with the registry flag: quorum-wizard --registry yourcustomregistry.example.com\n')
    throw new Error('Remote generation failed')
  }
  if (isDocker(config.network.deployment)) {
    const permissionedNodesLocation = joinPath(networkPath, 'out/config/permissioned-nodes.json')
    const nodesWithSubnetReplaced = readFileToString(permissionedNodesLocation)
      .replace(
        /%QUORUM-NODE([0-9])_SERVICE_HOST%/g,
        `${buildDockerIp(config.containerPorts.dockerSubnet, '1')}$1`,
      )
    writeFile(permissionedNodesLocation, nodesWithSubnetReplaced)
    copyDirectory(remoteOutputDir, configDir)
  }
  if (config.network.splunk) {
    copyDirectory(joinPath(libRootDir(), 'lib', 'splunk'), joinPath(remoteOutputDir, 'splunk'))
  }
}

export async function generateResourcesLocally(config) {
  info('Generating network resources locally...')
  const configDir = getFullResourceConfigDir(config)
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

  const configPath = getFullResourceConfigDir(config)

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

export function getFullResourceConfigDir(config) {
  return joinPath(config.network.networkPath, config.network.configDir)
}

export function getConfigsPath(...relativePaths) {
  return joinPath(getOutputPath(), 'configs', ...relativePaths)
}

export function getAvailableConfigs() {
  const configDir = getConfigsPath()
  const availableConfigs = readDir(configDir) || []
  return [CUSTOM_CONFIG_LOCATION, ...availableConfigs]
}

export function createScripts(config) {
  const scripts = [
    SCRIPTS.start,
    SCRIPTS.stop,
    SCRIPTS.runscript,
    SCRIPTS.attach,
    SCRIPTS.publicContract,
  ]
  if (isTessera(config.network.transactionManager)) {
    scripts.push(SCRIPTS.privateContract)
  }
  if (isKubernetes(config.network.deployment)) {
    scripts.push(SCRIPTS.getEndpoints)
  }

  const networkPath = getFullNetworkPath(config)
  scripts.forEach((script) => writeScript(networkPath, config, script))
}
