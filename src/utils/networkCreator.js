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
import { generateConsensusConfig } from '../model/ConsensusConfig'

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

  const configPath = join(process.cwd(), config.network.configDir)
  if(config.network.generateKeys) {
      generateKeys(config, configPath)
      generateConsensusConfig(configPath, config.network.consensus, config.nodes)
  }

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus, config.network.configDir)
  const initCommands = []
  const startCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = join(configPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, 'geth')
    const keyDir = join(quorumDir, 'keystore')
    const tmDir = join(qdata, `c${nodeNumber}`)
    const passwordDestination = join(keyDir, 'password.txt')
    const genesisDestination = join(quorumDir, `${config.network.consensus}-genesis.json`)
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
    copyFile(join(configPath, `${config.network.consensus}-genesis.json`), genesisDestination)
    if(isTessera(config)) {
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
  copyFile(join(process.cwd(), 'lib/runscript.sh'), join(networkPath, 'runscript.sh'))
  copyFile(join(process.cwd(), 'lib/public-contract.js'), join(networkPath, 'public-contract.js'))
  copyFile(join(process.cwd(), 'lib/private-contract.js'), join(networkPath, 'private-contract.js'))

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

export function createStaticNodes (nodes, consensus, configDir) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `${configDir}/key${nodeNumber}`
    const enodeId = readFileToString(join(generatedKeyFolder, 'enode'))

    let enodeAddress = `enode://${enodeId}@${node.quorum.ip}:${node.quorum.devP2pPort}?discport=0`
    if (consensus === 'raft') {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}

export function isTessera (config) {
  return config.network.transactionManager === 'tessera'
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
