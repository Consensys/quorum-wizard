import { anything } from 'expect'
import { generateNodeConfigs } from './NetworkConfig'
import {
  generateIstanbulConfig,
  generateRaftConfig,
  generateConsensusConfig,
} from './ConsensusConfig'
import {
  generateAccounts,
  generateExtraData,
} from '../generators/consensusHelper'
import { writeJsonFile } from '../utils/fileUtils'
import { LATEST_TESSERA } from '../generators/download'

jest.mock('../generators/consensusHelper')
jest.mock('../utils/fileUtils')

test('creates 3nodes raft genesis', () => {
  const accts = '{"0xa5a0b81cbcd2d93bba08b3e27b1437d7bdc42836":{"balance":"1000000000000000000000000000"},"0x0fe3fd1414001b295da621e30698462df06eaad2":{"balance":"1000000000000000000000000000"},"0x8aef5fa7f18ffda8fa98016ec27562ea33743f18":{"balance":"1000000000000000000000000000"}}'
  generateAccounts
    .mockReturnValueOnce(JSON.parse(accts))

  const genesis = generateRaftConfig(3, 'keyPath', 10, LATEST_TESSERA)
  expect(genesis).toMatchSnapshot()
})

test('creates 3nodes raft genesis without privacy enhancements', () => {
  const accts = '{"0xa5a0b81cbcd2d93bba08b3e27b1437d7bdc42836":{"balance":"1000000000000000000000000000"},"0x0fe3fd1414001b295da621e30698462df06eaad2":{"balance":"1000000000000000000000000000"},"0x8aef5fa7f18ffda8fa98016ec27562ea33743f18":{"balance":"1000000000000000000000000000"}}'
  generateAccounts
    .mockReturnValueOnce(JSON.parse(accts))

  const genesis = generateRaftConfig(3, 'keyPath', 10, '0.10.6')
  expect(genesis).toMatchSnapshot()
})

test('creates 5nodes istanbul genesis', () => {
  const accts = '{"0x59b64581638fd8311423e007c5131b0d9287d069":{"balance":"1000000000000000000000000000"},"0x4e03a788769f04bb8ec13826d1efe6cd9ca46190":{"balance":"1000000000000000000000000000"},"0xb01a34cca09374a58068eda1c2d7e472f39ef413":{"balance":"1000000000000000000000000000"}, "0xdbd868dd04daf492b783587f50bdd82fbf9bda3f":{"balance":"1000000000000000000000000000"}, "0x62fdbfa6bebe19c812f3bceb3d2d16b00563862c":{"balance":"1000000000000000000000000000"}}'
  generateAccounts
    .mockReturnValueOnce(JSON.parse(accts))

  generateExtraData.mockReturnValueOnce(
    '0x0000000000000000000000000000000000000000000000000000000000000000f8aff86994dea501aa3315db296f1ce0f7d264c6c812b2088a942da3b70ed4e94ad02641ef83d33727d86da41e78945a4a874f95cd8f0758dea8f6719cd686aedc30e994d34cb7199598f100f76eed6fdfe962b37a66b7dc9499fc6e8ac3f567ae9ee11559e0fa686513aa9e74b8410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0',
  )

  const genesis = generateIstanbulConfig(5, 'testDir', 10, LATEST_TESSERA)
  expect(genesis).toMatchSnapshot()
})

test('generates raft consensus file', () => {
  const nodes = generateNodeConfigs(5)
  const accts = '{"0x59b64581638fd8311423e007c5131b0d9287d069":{"balance":"1000000000000000000000000000"},"0x4e03a788769f04bb8ec13826d1efe6cd9ca46190":{"balance":"1000000000000000000000000000"},"0xb01a34cca09374a58068eda1c2d7e472f39ef413":{"balance":"1000000000000000000000000000"}, "0xdbd868dd04daf492b783587f50bdd82fbf9bda3f":{"balance":"1000000000000000000000000000"}, "0x62fdbfa6bebe19c812f3bceb3d2d16b00563862c":{"balance":"1000000000000000000000000000"}}'
  generateAccounts
    .mockReturnValueOnce(JSON.parse(accts))
  generateConsensusConfig('testConfigDir', 'raft', nodes, 10, LATEST_TESSERA)
  expect(writeJsonFile).toBeCalledWith('testConfigDir', 'genesis.json', anything())
})

test('generates istanbul consensus file', () => {
  const nodes = generateNodeConfigs(5)
  const accts = '{"0x59b64581638fd8311423e007c5131b0d9287d069":{"balance":"1000000000000000000000000000"},"0x4e03a788769f04bb8ec13826d1efe6cd9ca46190":{"balance":"1000000000000000000000000000"},"0xb01a34cca09374a58068eda1c2d7e472f39ef413":{"balance":"1000000000000000000000000000"}, "0xdbd868dd04daf492b783587f50bdd82fbf9bda3f":{"balance":"1000000000000000000000000000"}, "0x62fdbfa6bebe19c812f3bceb3d2d16b00563862c":{"balance":"1000000000000000000000000000"}}'
  generateAccounts
    .mockReturnValueOnce(JSON.parse(accts))
  generateConsensusConfig('testConfigDir', 'istanbul', nodes, 10, LATEST_TESSERA)
  expect(writeJsonFile).toBeCalledWith('testConfigDir', 'genesis.json', anything())
})
