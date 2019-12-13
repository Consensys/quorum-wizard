import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  removeFolder,
  writeFile,
  writeJsonFile
} from './fileUtils'

export function createNetwork (config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/
  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  const networkPath = path.join(process.cwd(), 'network', networkFolderName)
  removeFolder(networkPath)

  const qdata = path.join(networkPath, 'qdata')
  const logs = path.join(qdata, 'logs')
  createFolder(logs, true)
  writeJsonFile(networkPath, 'config.json', config)

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus)
  const initCommands = []
  const startCommands = []
  const examplesPath = path.join(process.cwd(), '7nodes')

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = path.join(examplesPath, `key${nodeNumber}`)
    const quorumDir = path.join(qdata, `dd${nodeNumber}`)
    const gethDir = path.join(quorumDir, `geth`)
    const keyDir = path.join(quorumDir, `keystore`)
    const tmDir = path.join(qdata, `c${nodeNumber}`)
    const passwordDestination = path.join(keyDir, 'password.txt')
    let genesisDestination = path.join(quorumDir, 'genesis.json')
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)

    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(path.normalize(config.network.genesisFile), genesisDestination)
    copyFile(path.join(keyFolder, 'key'), path.join(keyDir, 'key'))
    copyFile(path.join(keyFolder, 'nodekey'), path.join(gethDir, 'nodekey'))
    copyFile(path.join(keyFolder, 'password.txt'), passwordDestination)
    copyFile(path.join(keyFolder, 'tm.key'), path.join(tmDir, 'tm.key'))
    copyFile(path.join(keyFolder, 'tm.pub'), path.join(tmDir, 'tm.pub'))

    const initCommand = `cd ${networkPath} && geth --datadir ${quorumDir} init ${genesisDestination}`
    initCommands.push(initCommand)

    const startCommand = createGethStartCommand(config, node,
      passwordDestination,
      nodeNumber)
    startCommands.push(startCommand)
  })

  writeFile(path.join(networkPath, 'start.sh'), startCommands.join('\n'), true)
  copyFile(path.join(process.cwd(), 'lib/stop.sh'),
    path.join(networkPath, 'stop.sh'))

  // initialize all the nodes
  initCommands.forEach((command) => {
    // TODO figure out the safest way to run shell commands
    exec(command, (e, stdout, stderr) => {
      if (e instanceof Error) {
        console.error(e)
        throw e
      }
    })
  })
}

function createStaticNodes (nodes, consensus) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `7nodes/key${nodeNumber}`
    const enodeId = fs.readFileSync(path.join(generatedKeyFolder, 'enode'),
      'utf8').trim()

    let enodeAddress = `enode://${enodeId}@127.0.0.1:${node.quorum.devP2pPort}?discport=0`
    if (consensus === 'raft') {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}

function createGethStartCommand (config, node, passwordDestination,
  nodeNumber) {
  const { verbosity, id, consensus } = config.network
  const { devP2pPort, rpcPort, wsPort, raftPort } = node.quorum

  const args = `--nodiscover --rpc --rpccorsdomain=* --rpcvhosts=* --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,${consensus},quorumPermission --emitcheckpoints --unlock 0 --password ${passwordDestination}`
  const consensusArgs = consensus === 'raft' ?
    `--raft --raftport ${raftPort}` :
    `--istanbul.blockperiod 5 --syncmode full --mine --minerthreads 1`

  return `PRIVATE_CONFIG=ignore nohup geth --datadir qdata/dd${nodeNumber} ${args} ${consensusArgs} --permissioned --verbosity ${verbosity} --networkid ${id} --rpcport ${rpcPort} --port ${devP2pPort} 2>>qdata/logs/${nodeNumber}.log &`
}

