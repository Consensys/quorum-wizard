export function createQuickstartConfig (numberNodes, consensus, transactionManager, deployment, cakeshop) {
  return {
    network: {
      name: `${numberNodes}-nodes-${consensus}-${transactionManager}-${deployment}`,
      verbosity: 5,
      consensus: consensus,
      transactionManager: transactionManager,
      id: 10,
      permissioned: true,
      genesisFile: `7nodes/${consensus}-genesis.json`,
      generateKeys: false,
      configDir: `7nodes`,
      deployment: deployment,
      cakeshop: cakeshop,
      custom: false,
    },
    nodes: generateNodeConfigs(numberNodes, transactionManager, deployment, cakeshop)
  }
}

export function createCustomConfig (numberNodes, consensus, transactionManager, deployment, cakeshop,
  keyGeneration, networkId, genesisLocation, defaultPorts, nodes) {
  return {
    network: {
      name: `${numberNodes}-nodes-${consensus}-${transactionManager}-${deployment}`,
      verbosity: 5,
      consensus: consensus,
      transactionManager: transactionManager,
      id: 10,
      permissioned: true,
      genesisFile: genesisLocation,
      generateKeys: keyGeneration,
      configDir: `network/${numberNodes}-nodes-${consensus}-${transactionManager}-${deployment}/generated`,
      passwordFile: '7nodes/key1/password.txt',
      deployment: deployment,
      cakeshop: cakeshop,
      networkId: networkId,
      custom: true,
      defaultPorts: defaultPorts,
     },
     nodes: defaultPorts ? generateNodeConfigs(numberNodes, transactionManager, deployment, cakeshop) : nodes
   }
 }

export function isDocker (deployment) {
  return deployment === 'docker-compose'
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
        ip: isDocker(deployment) ? `172.16.239.1${i+1}` : '127.0.0.1',
        devP2pPort: devP2pPort + i,
        rpcPort: rpcPort + i,
        wsPort: wsPort + i,
        raftPort: raftPort + i,
      },
    }
    if(transactionManager === 'tessera') {
      node.tm = {
        ip: isDocker(deployment) ? `172.16.239.10${i+1}` : '127.0.0.1',
        thirdPartyPort: thirdPartyPort + i,
        p2pPort: p2pPort + i,
        enclavePort: enclavePort + i,
      }
    }
    nodes.push(node)
  }
  return nodes
}
