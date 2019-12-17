export function createQuickstartConfig (numberNodes, consensus, transactionManager, deployment) {
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
    },
    nodes: generateNodeConfigs(numberNodes, transactionManager)
  }
}

export function createCustomConfig (numberNodes, consensus, transactionManager, deployment) {
  return {
    network: {
      name: `${numberNodes}-nodes-${consensus}-${transactionManager}-${deployment}`,
      verbosity: 5,
      consensus: consensus,
      transactionManager: transactionManager,
      id: 10,
      permissioned: true,
      genesisFile: `7nodes/${consensus}-genesis.json`,
      generateKeys: true,
      configDir: `network/${numberNodes}-nodes-${consensus}-${transactionManager}-${deployment}/generated`,
      passwordFile: '7nodes/key1/password.txt',
     },
     nodes: generateNodeConfigs(numberNodes, transactionManager)
   }
 }

export function generateNodeConfigs (numberNodes, transactionManager) {
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
        ip: '127.0.0.1',
        devP2pPort: devP2pPort + i,
        rpcPort: rpcPort + i,
        wsPort: wsPort + i,
        raftPort: raftPort + i,
      },
    }
    if(transactionManager === 'tessera') {
      node.tm = {
        ip: '127.0.0.1',
        thirdPartyPort: thirdPartyPort + i,
          p2pPort: p2pPort + i,
          enclavePort: enclavePort + i,
      }
    }
    nodes.push(node)
  }
  return nodes
}
