import cmp from 'semver-compare'
import { isJava11Plus } from '../utils/execUtils'
import {
  LATEST_CAKESHOP,
  LATEST_CAKESHOP_J8,
  LATEST_QUORUM,
  LATEST_TESSERA,
  LATEST_TESSERA_J8,
} from '../generators/download'

export function createConfigFromAnswers(answers) {
  const {
    name,
    numberNodes = 3,
    consensus = 'raft',
    quorumVersion = LATEST_QUORUM,
    quorumVersionMore = undefined,
    transactionManager = isJava11Plus() ? LATEST_TESSERA : LATEST_TESSERA_J8,
    deployment = 'bash',
    cakeshop = isJava11Plus() ? LATEST_CAKESHOP : LATEST_CAKESHOP_J8,
    generateKeys = false,
    networkId = '10',
    genesisLocation = 'none',
    customizePorts = false,
    nodes = [],
    cakeshopPort = '8999',
    remoteDebug = false,
  } = answers
  const networkFolder = name
    || defaultNetworkName(numberNodes, consensus, transactionManager, deployment)
  return {
    network: {
      name: networkFolder,
      verbosity: 5,
      consensus,
      quorumVersion: quorumVersionMore === undefined ? quorumVersion : quorumVersionMore,
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
    containerPorts: (!isBash(deployment)) ? getContainerPorts() : {},
  }
}

export function defaultNetworkName(numberNodes, consensus, transactionManager, deployment) {
  const transactionManagerName = !isTessera(transactionManager)
    ? ''
    : 'tessera-'
  return `${numberNodes}-nodes-${consensus}-${transactionManagerName}${deployment}`
}

export function generateNodeConfigs(numberNodes, transactionManager, deployment) {
  const devP2pPort = 21000
  const rpcPort = 22000
  const wsPort = 23000
  const raftPort = 50401
  const thirdPartyPort = 9081
  const p2pPort = 9001
  const nodes = []

  for (let i = 0; i < parseInt(numberNodes, 10); i += 1) {
    const node = {
      quorum: {
        ip: isDocker(deployment) ? `172.16.239.1${i + 1}` : '127.0.0.1',
        devP2pPort: devP2pPort + i,
        rpcPort: rpcPort + i,
        wsPort: wsPort + i,
        raftPort: raftPort + i,
      },
    }
    if (isTessera(transactionManager)) {
      node.tm = {
        ip: isDocker(deployment) ? `172.16.239.10${i + 1}` : '127.0.0.1',
        thirdPartyPort: thirdPartyPort + i,
        p2pPort: p2pPort + i,
      }
    }
    nodes.push(node)
  }
  return nodes
}

export function getContainerPorts() {
  return {
    quorum: {
      rpcPort: 8545,
      p2pPort: 21000,
      raftPort: 50400,
      wsPort: 8645,
    },
    tm: {
      p2pPort: 9000,
      thirdPartyPort: 9080,
    },
  }
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

export function isQuorum260Plus(quorumVersion) {
  return cmp(quorumVersion, '2.6.0') >= 0
}
