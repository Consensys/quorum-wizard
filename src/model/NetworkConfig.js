export function createQuickstartConfig (numberNodes, consensus, deployment) {
  return {
    network: {
      name: `${numberNodes}-nodes-${consensus}-${deployment}`,
      verbosity: 5,
      consensus: consensus,
      id: 10,
      permissioned: 'true',
      genesisFile: `7nodes/${consensus}-genesis.json`,
      generateKeys: 'false',
    },
    nodes: generateNodeConfigs(numberNodes)
  }
}

function generateNodeConfigs (numberNodes) {
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
        devP2pPort: devP2pPort + i,
        rpcPort: rpcPort + i,
        wsPort: wsPort + i,
        raftPort: raftPort + i,
      },
      tm: {
        thirdPartyPort: thirdPartyPort + i,
        p2pPort: p2pPort + i,
        enclavePort: enclavePort + i,
      }
    }
    nodes.push(node)
  }
  return nodes
}
