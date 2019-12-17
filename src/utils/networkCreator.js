import { join, normalize } from 'path'
import { execute } from './execUtils'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  readFileToString,
  removeFolder,
  writeFile,
  writeJsonFile
} from './fileUtils'
import { generateKeys } from './keyGen'

export function createNetwork (config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/
  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  const networkPath = join(process.cwd(), 'network', networkFolderName)
  removeFolder(networkPath)

  const qdata = join(networkPath, 'qdata')
  const logs = join(qdata, 'logs')
  createFolder(logs, true)
  writeJsonFile(networkPath, 'config.json', config)

  var keyPath = join(process.cwd(), config.network.keyDir)
  if(config.network.generateKeys) {
      generateKeys(config, keyPath)
  }

  const staticNodes = createStaticNodes(config, config.network.consensus)
  const initCommands = []
  const startCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = join(keyPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, `geth`)
    const keyDir = join(quorumDir, `keystore`)
    const tmDir = join(qdata, `c${nodeNumber}`)
    const passwordDestination = join(keyDir, 'password.txt')
    let genesisDestination = join(quorumDir, 'genesis.json')
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)

    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(normalize(config.network.genesisFile), genesisDestination)
    copyFile(join(keyFolder, 'key'), join(keyDir, 'key'))
    copyFile(join(keyFolder, 'nodekey'), join(gethDir, 'nodekey'))
    copyFile(join(keyFolder, 'password.txt'), passwordDestination)

    if(config.network.tessera) {
      copyFile(join(keyFolder, 'tm.key'), join(tmDir, 'tm.key'))
      copyFile(join(keyFolder, 'tm.pub'), join(tmDir, 'tm.pub'))
    }

    const initCommand = `cd ${networkPath} && geth --datadir ${quorumDir} init ${genesisDestination}`
    initCommands.push(initCommand)

    const startCommand = createGethStartCommand(config, node,
      passwordDestination,
      nodeNumber)
    startCommands.push(startCommand)
  })

  writeFile(join(networkPath, 'start.sh'), startCommands.join('\n'), true)
  copyFile(join(process.cwd(), 'lib/stop.sh'), join(networkPath, 'stop.sh'))

  // initialize all the nodes
  initCommands.forEach((command) => {
    // TODO figure out the safest way to run shell commands
    execute(command, (e, stdout, stderr) => {
      if (e instanceof Error) {
        console.error(e)
        throw e
      }
    })
  })
}

function createStaticNodes (config, consensus) {
  return config.nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `${config.network.keyDir}/key${nodeNumber}`
    const enodeId = readFileToString(join(generatedKeyFolder, 'enode'),
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
