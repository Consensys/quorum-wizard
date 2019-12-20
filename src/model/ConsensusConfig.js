import {
  writeFile,
  writeJsonFile,
  combineFiles,
  readFileToString
} from '../utils/fileUtils'
import { join } from 'path'
import { executeSync } from '../utils/execUtils'
const Web3 = require('web3');

export function generateConsensusConfig(configDir, consensus, nodes) {
  return consensus == `raft` ?  generateRaft(configDir, nodes) :
  generateIstanbul(configDir, nodes)
}

function generateRaft(configDir, nodes) {
  writeJsonFile(configDir, `raft-genesis.json`, generateRaftConfig(nodes, configDir))
}

function generateIstanbul(configDir, nodes) {
  writeJsonFile(configDir, `istanbul-genesis.json`, generateIstanbulConfig(nodes, configDir))
}

export function generateAccounts(nodes, configDir) {
  var numNodes = nodes.length
  var raftJsonString = `{`
  for (let i = 1; i < parseInt(numNodes, 10); i++) {
    let keyDir = join(configDir, `key${i}`)
    let keyString = readFileToString(join(keyDir, 'key'))

    raftJsonString += `\"${JSON.parse(keyString).address}\":{\"balance\":\"1000000000000000000000000000\"},`
  }
  let keyDir = join(configDir, `key${numNodes}`)
  let keyString = readFileToString(join(keyDir, 'key'))

  raftJsonString += `\"${JSON.parse(keyString).address}\":{\"balance\":\"1000000000000000000000000000\"}}`
  return JSON.parse(raftJsonString)
}

function generateRaftConfig(numNodes, configDir) {
  const alloc = generateAccounts(numNodes, configDir)
  return {
    alloc: alloc,
    coinbase: `0x0000000000000000000000000000000000000000`,
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      chainId: 10,
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: `0x0000000000000000000000000000000000000000000000000000000000000000`,
      eip158Block: 0,
      maxCodeSize: 35,
      isQuorum: true,
    },
    difficulty: `0x0`,
    extraData: `0x0000000000000000000000000000000000000000000000000000000000000000`,
    gasLimit: `0xE0000000`,
    mixhash: `0x00000000000000000000000000000000000000647572616c65787365646c6578`,
    nonce: `0x0`,
    parentHash: `0x0000000000000000000000000000000000000000000000000000000000000000`,
    timestamp: `0x00`
  }
}

function generateExtraData(nodes, configDir) {
  var validatorConfigString = `vanity = \"0x00\"\nvalidators=[`
  var numNodes = nodes.length
  for (let i = 1; i < parseInt(numNodes, 10); i++) {
      let keyDir = join(configDir, `key${i}`)
      let nodekey = nodekeyToAccount(readFileToString(join(keyDir, 'nodekey')))
      validatorConfigString += `\"${nodekey}\",`
  }
  let keyDir = join(configDir, `key${numNodes}`)
  let nodekey = nodekeyToAccount(readFileToString(join(keyDir, 'nodekey')))
  validatorConfigString += `\"${nodekey}\"]`

  var istanbulConfigFile = join(configDir, 'istanbul.toml')
  writeFile(istanbulConfigFile, validatorConfigString, false)

  var extraDataCmd = `cd ${configDir} && istanbul extra encode --config ${istanbulConfigFile} | awk '{print $4}' > extraData`
  executeSync(extraDataCmd, function(err, stdout, stderr) {
    if (e instanceof Error) {
      console.error(e)
      throw e
    }
  })
  return readFileToString(join(configDir, 'extraData'))
}

function nodekeyToAccount(nodekey) {
  const web3 = new Web3();
  var acctObj = web3.eth.accounts.privateKeyToAccount(nodekey);
  return acctObj.address
}

function generateIstanbulConfig(nodes, configDir) {
  const alloc = generateAccounts(nodes, configDir)
  const extraData = generateExtraData(nodes, configDir)
  return {
    alloc: alloc,
    coinbase: `0x0000000000000000000000000000000000000000`,
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      chainId: 10,
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: `0x0000000000000000000000000000000000000000000000000000000000000000`,
      eip158Block: 0,
      maxCodeSize: 35,
      isQuorum: true,
      istanbul: {
        epoch: 30000,
        policy: 0,
        ceil2Nby3Block: 0,
      }
    },
    difficulty: `0x1`,
    extraData: extraData,
    gasLimit: `0xE0000000`,
    mixhash: `0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365`,
    nonce: `0x0`,
    parentHash: `0x0000000000000000000000000000000000000000000000000000000000000000`,
    timestamp: `0x00`
  }

}
