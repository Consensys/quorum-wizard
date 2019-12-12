const inquirer = require('inquirer')
const fs = require('fs')
const exec = require('child_process').exec;
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
      verbosity: 5,
      consensus: consensus,
      id: 10,
      permissioned: 'true',
      genesisFile: `7nodes/${consensus}-genesis.json`,
      generateKeys: 'false',
    },
    nodes: generateNodeConfigs(numberNodes)
  }

  createNetwork(config)
}

function createNetwork (config) {
  // TODO let's make all these file system operations safe, so someone doesn't
  // TODO accidentally/intentionally rm -rf network/../../../ :)
  let path = `network/${config.network.name}`
  fs.rmdirSync(path, {recursive: true})
  let qdata = `${path}/qdata`
  fs.mkdirSync(qdata, {recursive: true})
  fs.mkdirSync(`${qdata}/logs`)
  fs.writeFileSync(`${path}/config.json`, JSON.stringify(config, null, 2))

  const staticNodes = generateStaticNodes(config.nodes, config.network.consensus)
  const startCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `7nodes/key${nodeNumber}`
    let quorumDir = `${qdata}/dd${nodeNumber}`
    let gethDir = `${quorumDir}/geth`
    let keyDir = `${quorumDir}/keystore`
    let tmDir = `${qdata}/c${nodeNumber}`
    fs.mkdirSync(quorumDir)
    fs.mkdirSync(gethDir)
    fs.mkdirSync(keyDir)
    fs.mkdirSync(tmDir)

    fs.writeFileSync(`${quorumDir}/permissioned-nodes.json`, JSON.stringify(staticNodes, null, 2))
    fs.writeFileSync(`${quorumDir}/static-nodes.json`, JSON.stringify(staticNodes, null, 2))
    fs.copyFileSync(`${config.network.genesisFile}`, `${quorumDir}/genesis.json`)
    fs.copyFileSync(`${generatedKeyFolder}/key`, `${keyDir}/key`)
    fs.copyFileSync(`${generatedKeyFolder}/nodekey`, `${gethDir}/nodekey`)
    fs.copyFileSync(`${generatedKeyFolder}/password.txt`, `${keyDir}/password.txt`)
    fs.copyFileSync(`${generatedKeyFolder}/tm.key`, `${tmDir}/tm.key`)
    fs.copyFileSync(`${generatedKeyFolder}/tm.pub`, `${tmDir}/tm.pub`)

    const { verbosity, id, consensus } = config.network
    const { devP2pPort, rpcPort, wsPort, raftPort } = node.quorum

    const args = `--nodiscover --rpc --rpccorsdomain=* --rpcvhosts=* --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,${consensus},quorumPermission --emitcheckpoints --unlock 0 --password qdata/dd${nodeNumber}/keystore/password.txt`
    const consensusArgs = consensus === 'raft' ?
      `--raft --raftport ${raftPort}` :
      `--istanbul.blockperiod 5 --syncmode full --mine --minerthreads 1`

    const startCommand = `PRIVATE_CONFIG=ignore nohup geth --datadir qdata/dd${nodeNumber} ${args} ${consensusArgs} --permissioned --verbosity ${verbosity} --networkid ${id} --rpcport ${rpcPort} --port ${devP2pPort} 2>>qdata/logs/${nodeNumber}.log &`
    startCommands.push(startCommand)
  })

  config.nodes.forEach((node, i) => {
    // TODO figure out the safest way to run shell commands
    let nodeNumber = i + 1
    exec(
      `cd ${path} && geth --datadir qdata/dd${nodeNumber} init qdata/dd${nodeNumber}/genesis.json`,
      (e, stdout, stderr) => {
        if (e instanceof Error) {
          console.error(e)
          throw e
        }
      })
  })
  fs.writeFileSync(`${path}/start.sh`, startCommands.join('\n'))
  fs.chmodSync(`${path}/start.sh`, '755')
  fs.copyFileSync(`lib/stop.sh`, `${path}/stop.sh`)

  exitMessage = `Network successfully created. Run the following to start your network:\n\ncd ${path}\n./start.sh`
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

function generateStaticNodes (nodes, consensus) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `7nodes/key${nodeNumber}`
    const enodeId = fs.readFileSync(`${generatedKeyFolder}/enode`,
      'utf8').trim()

    let enodeAddress = `enode://${enodeId}@127.0.0.1:${node.quorum.devP2pPort}?discport=0`
    if (consensus === 'raft') {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}


start()
