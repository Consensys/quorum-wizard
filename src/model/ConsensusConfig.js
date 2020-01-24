import { writeJsonFile,} from '../utils/fileUtils'
import {generateAccounts, generateExtraData } from '../utils/consensusHelper'

export function generateConsensusConfig(configDir, consensus, nodes) {
  return consensus === 'raft' ?  generateRaft(configDir, nodes) :
  generateIstanbul(configDir, nodes)
}

function generateRaft(configDir, nodes) {
  writeJsonFile(configDir, 'raft-genesis.json', generateRaftConfig(nodes, configDir))
}

function generateIstanbul(configDir, nodes) {
  writeJsonFile(configDir, 'istanbul-genesis.json', generateIstanbulConfig(nodes, configDir))
}

export function generateRaftConfig(nodes, configDir) {
  const alloc = generateAccounts(nodes, configDir)
  return {
    alloc: alloc,
    coinbase: '0x0000000000000000000000000000000000000000',
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      chainId: 10,
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      eip158Block: 0,
      maxCodeSize: 35,
      isQuorum: true,
    },
    difficulty: '0x0',
    extraData: '0x0000000000000000000000000000000000000000000000000000000000000000',
    gasLimit: '0xE0000000',
    mixhash: '0x00000000000000000000000000000000000000647572616c65787365646c6578',
    nonce: '0x0',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x00'
  }
}

export function generateIstanbulConfig(nodes, configDir) {
  const alloc = generateAccounts(nodes, configDir)
  const extraData = generateExtraData(nodes, configDir)
  return {
    alloc: alloc,
    coinbase: '0x0000000000000000000000000000000000000000',
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      chainId: 10,
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      eip158Block: 0,
      maxCodeSize: 35,
      isQuorum: true,
      istanbul: {
        epoch: 30000,
        policy: 0,
        ceil2Nby3Block: 0,
      }
    },
    difficulty: '0x1',
    extraData: extraData,
    gasLimit: '0xE0000000',
    mixhash: '0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365',
    nonce: '0x0',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x00'
  }
}