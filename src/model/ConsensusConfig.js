import { writeJsonFile } from '../utils/fileUtils'
import {
  generateAccounts,
  generateExtraData,
} from '../generators/consensusHelper'
import { isRaft } from './NetworkConfig'
import { isLegacyTessera } from '../generators/binaryHelper'

export function generateConsensusConfig(configDir, consensus, nodes, networkId, tessera) {
  writeJsonFile(
    configDir,
    'genesis.json',
    isRaft(consensus)
      ? generateRaftConfig(nodes, configDir, networkId, tessera)
      : generateIstanbulConfig(nodes, configDir, networkId, tessera),
  )
}

export function generateRaftConfig(nodes, configDir, networkId, tessera) {
  const alloc = generateAccounts(nodes, configDir)
  const privacyEnhancementsBlock = isLegacyTessera(tessera) ? undefined : 0
  return {
    alloc,
    coinbase: '0x0000000000000000000000000000000000000000',
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      istanbulBlock: 0,
      petersburgBlock: 0,
      privacyEnhancementsBlock,
      chainId: parseInt(networkId, 10),
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      eip158Block: 0,
      maxCodeSizeConfig: [
        {
          block: 0,
          size: 32,
        },
      ],
      isQuorum: true,
    },
    difficulty: '0x0',
    extraData: '0x0000000000000000000000000000000000000000000000000000000000000000',
    gasLimit: '0xE0000000',
    mixhash: '0x00000000000000000000000000000000000000647572616c65787365646c6578',
    nonce: '0x0',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x00',
  }
}

export function generateIstanbulConfig(nodes, configDir, networkId, tessera) {
  const alloc = generateAccounts(nodes, configDir)
  const extraData = generateExtraData(nodes, configDir)
  const privacyEnhancementsBlock = isLegacyTessera(tessera) ? undefined : 0
  return {
    alloc,
    coinbase: '0x0000000000000000000000000000000000000000',
    config: {
      homesteadBlock: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      istanbulBlock: 0,
      petersburgBlock: 0,
      privacyEnhancementsBlock,
      chainId: parseInt(networkId, 10),
      eip150Block: 0,
      eip155Block: 0,
      eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      eip158Block: 0,
      maxCodeSizeConfig: [
        {
          block: 0,
          size: 32,
        },
      ],
      isQuorum: true,
      istanbul: {
        epoch: 30000,
        policy: 0,
        ceil2Nby3Block: 0,
      },
    },
    difficulty: '0x1',
    extraData,
    gasLimit: '0xE0000000',
    mixhash: '0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365',
    nonce: '0x0',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: '0x00',
  }
}
