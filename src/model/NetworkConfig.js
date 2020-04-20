import { isJava11Plus } from '../utils/execUtils'

export function createConfigFromAnswers(answers) {
  const {
    numberNodes = 3,
    consensus = 'raft',
    quorumVersion = '2.5.0',
    transactionManager = isJava11Plus() ? '0.10.4' : '0.10.2',
    deployment = 'bash',
    cakeshop = isJava11Plus() ? '0.11.0' : '0.11.0-J8',
    generateKeys = false,
    networkId = '10',
    genesisLocation = 'none',
    customizePorts = false,
    nodes = [],
    cakeshopPort = '8999',
    remoteDebug = false,
  } = answers
  const networkFolder = createNetworkFolderName(
    numberNodes,
    consensus,
    transactionManager,
    deployment,
  )
  return {
    network: {
      name: networkFolder,
      verbosity: 5,
      consensus,
      quorumVersion,
      transactionManager,
      permissioned: true,
      genesisFile: genesisLocation,
      generateKeys,
      configDir: `network/${networkFolder}/resources`,
      deployment,
      cakeshop,
      networkId,
      customizePorts,
      cakeshopPort,
      remoteDebug,
    },
    nodes: (customizePorts && nodes.length > 0) ? nodes : generateNodeConfigs(
      numberNodes,
      transactionManager,
      deployment,
      cakeshop,
    ),
  }
}

function createNetworkFolderName(numberNodes, consensus, transactionManager, deployment) {
  const transactionManagerName = !isTessera(transactionManager)
    ? ''
    : 'tessera-'
  return `${numberNodes}-nodes-${consensus}-${transactionManagerName}${deployment}`
}

export function generateNodeConfigs(numberNodes, transactionManager, deployment) {
  const devP2pPort = isKubernetes(deployment) ? 30303 : 21000
  const rpcPort = isKubernetes(deployment) ? 8545 : 22000
  const wsPort = 23000
  const raftPort = 50401
  const thirdPartyPort = 9081
  const p2pPort = 9001
  const nodes = []

  for (let i = 0; i < parseInt(numberNodes, 10); i += 1) {
    const increment = isKubernetes(deployment) ? 0 : i
    const node = {
      quorum: {
        ip: isDocker(deployment) ? `172.16.239.1${increment + 1}` : '127.0.0.1',
        devP2pPort: devP2pPort + increment,
        rpcPort: rpcPort + increment,
        wsPort: wsPort + increment,
        raftPort: raftPort + increment,
      },
    }
    if (isTessera(transactionManager)) {
      node.tm = {
        ip: isDocker(deployment) ? `172.16.239.10${increment + 1}` : '127.0.0.1',
        thirdPartyPort: thirdPartyPort + increment,
        p2pPort: p2pPort + increment,
      }
    }
    nodes.push(node)
  }
  return nodes
}

export function isTessera(tessera) {
  return tessera !== 'none'
}

export function isDocker(deployment) {
  return deployment === 'docker-compose'
}

export function isBash(deployment) {
  return deployment === 'bash'
}

export function isKubernetes(deployment) {
  return deployment === 'kubernetes'
}

export function isIstanbul(consensus) {
  return consensus === 'istanbul'
}

export function isRaft(consensus) {
  return consensus === 'raft'
}

export function isCakeshop(cakeshop) {
  return cakeshop !== 'none'
}
