const inquirer = require('inquirer')
const {
  INITIAL_MODE,
  NUMBER_NODES,
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE
} = require('./questions')

let exitMessage = "Exiting..."

function start() {
  inquirer.prompt([INITIAL_MODE])
  .then(async ({ mode }) => {
    if (mode === 1) {
      await quickstart()
    } else if (mode === 2) {
      exitMessage = 'Customize mode not yet supported'
    }
    console.log(exitMessage)
  })
}

async function quickstart () {
  const { numberNodes, consensus, deployment } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    DEPLOYMENT_TYPE
  ])
  const config = {
    network: {
      name: `${numberNodes}-nodes-${consensus}-${deployment}`,
      consensus: consensus,
      id: 10,
      permissioned: 'true',
      genesis_file: `7nodes/${consensus}-genesis.json`,
      generate_keys: 'false',
    },
    nodes: []
  }
  let devP2pPort = 21000,
    rpcPort = 22000,
    wsPort = 23000,
    raftPort = 50401,
    thirdPartyPort = 9081,
    p2pPort = 9001,
    enclavePort = 9180
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
    config.nodes.push(node)
  }
  createNetwork(config)
}

function createNetwork (config) {
  console.log(config)
}


start()
