export function createQuickstartConfig() {
  return {
    network: {
      name: '3-nodes-raft-tessera-bash',
      verbosity: 5,
      consensus: 'raft',
      quorumVersion: '2.4.0',
      transactionManager: '0.10.2',
      permissioned: true,
      genesisFile: 'none',
      generateKeys: false,
      configDir: 'network/3-nodes-raft-tessera-bash/generated',
      deployment: 'bash',
      cakeshop: true,
      networkId: '10',
      custom: false,
    },
    nodes: generateNodeConfigs(3, 'tessera', 'bash', true)
  }
}
export function createReplica7NodesConfig (answers) {
  const {
    numberNodes,
    consensus,
    transactionManager,
    deployment,
    cakeshop,
    quorumVersion
  } = answers
  let networkFolder = createNetworkFolderName(answers)
  return {
    network: {
      name: networkFolder,
      verbosity: 5,
      consensus: consensus,
      quorumVersion: quorumVersion,
      transactionManager: transactionManager,
      permissioned: true,
      genesisFile: 'none',
      generateKeys: false,
      configDir: `network/${networkFolder}/generated`,
      deployment: deployment,
      cakeshop: cakeshop,
      networkId: '10',
      custom: false,
      customizePorts: false,
    },
    nodes: generateNodeConfigs(numberNodes, transactionManager, deployment, cakeshop),
    dockerCustom: undefined
  }
}

export function createCustomConfig (answers) {
  const {
    numberNodes,
    consensus,
    transactionManager,
    deployment,
    cakeshop,
    quorumVersion,
    generateKeys,
    networkId,
    genesisLocation,
    customizePorts,
    nodes,
    dockerCustom
  } = answers
  let networkFolder = createNetworkFolderName(answers)
  return {
    network: {
      name: networkFolder,
      verbosity: 5,
      consensus: consensus,
      quorumVersion: quorumVersion,
      transactionManager: transactionManager,
      permissioned: true,
      genesisFile: genesisLocation,
      generateKeys: generateKeys,
      configDir: `network/${networkFolder}/generated`,
      deployment: deployment,
      cakeshop: cakeshop,
      networkId: networkId,
      custom: true,
      customizePorts: customizePorts,
     },
     nodes: (customizePorts && nodes.length > 0) ? nodes : generateNodeConfigs(numberNodes, transactionManager, deployment, cakeshop),
     dockerCustom: dockerCustom
   }
 }

function createNetworkFolderName (answers) {
  const {numberNodes, consensus, transactionManager, deployment} = answers

  let transactionManagerName = transactionManager === 'none'
    ? ''
    : 'tessera-'
  return `${numberNodes}-nodes-${consensus}-${transactionManagerName}${deployment}`
}

export function generateNodeConfigs (numberNodes, transactionManager, deployment) {
  let devP2pPort = 21000,
    rpcPort = 22000,
    wsPort = 23000,
    raftPort = 50401,
    thirdPartyPort = 9081,
    p2pPort = 9001,
    enclavePort = 9180,
    nodes = []

  for (let i = 0; i < parseInt(numberNodes, 10); i++) {
    const node = {
      quorum: {
        ip: isDocker(deployment) ? `172.16.239.1${i + 1}` : '127.0.0.1',
        devP2pPort: devP2pPort + i,
        rpcPort: rpcPort + i,
        wsPort: wsPort + i,
        raftPort: raftPort + i,
      },
    }
    if(transactionManager !== 'none') {
      node.tm = {
        ip: isDocker(deployment) ? `172.16.239.10${i + 1}` : '127.0.0.1',
        thirdPartyPort: thirdPartyPort + i,
        p2pPort: p2pPort + i,
        enclavePort: enclavePort + i,
      }
    }
    nodes.push(node)
  }
  return nodes
}

export function isTessera (tessera) {
  return tessera !== 'none'
}

export function isDocker (deployment) {
  return deployment === 'docker-compose'
}

export function isBash (deployment) {
  return deployment === 'bash'
}

export function isIstanbul (consensus) {
  return consensus === 'istanbul'
}

export function isRaft (consensus) {
  return consensus === 'raft'
}
