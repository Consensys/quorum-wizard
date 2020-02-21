import { join } from 'path'
import {
  generateAccounts,
  generateExtraData,
} from './consensusHelper'
import nodekeyToAccount from '../utils/web3Helper'
import {
  cwd,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { generateNodeConfigs } from '../model/NetworkConfig'
import { executeSync } from '../utils/execUtils'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'

jest.mock('../utils/fileUtils')
jest.mock('../utils/web3Helper')
jest.mock('../utils/execUtils')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)

describe('generates accounts for genesis', () => {
  it('creates allocation account json given nodes', () => {
    const nodes = generateNodeConfigs(3)
    const accts = '{"0xa5a0b81cbcd2d93bba08b3e27b1437d7bdc42836":{"balance":"1000000000000000000000000000"},"0x0fe3fd1414001b295da621e30698462df06eaad2":{"balance":"1000000000000000000000000000"},"0x8aef5fa7f18ffda8fa98016ec27562ea33743f18":{"balance":"1000000000000000000000000000"}}'
    const expected = JSON.parse(accts)
    readFileToString
      .mockReturnValueOnce('{"address":"a5a0b81cbcd2d93bba08b3e27b1437d7bdc42836"}')
      .mockReturnValueOnce('{"address":"0fe3fd1414001b295da621e30698462df06eaad2"}')
      .mockReturnValueOnce('{"address":"8aef5fa7f18ffda8fa98016ec27562ea33743f18"}')

    expect(generateAccounts(nodes, 'keyPath')).toEqual(expected)
  })
})

describe('generates extraData for istanbul genesis', () => {
  it('creates extraData for given nodes', () => {
    const nodes = generateNodeConfigs(3)

    readFileToString
      .mockReturnValueOnce('0x48B4e05D804254f35e657c46cD25A6C4DaC85446')
      .mockReturnValueOnce('0xe63C266CB3b2750E8B210eA4E9154D6a099f6e53')
      .mockReturnValueOnce('0xFCF5B48D9972CF125f85c7aa04641942220A46C5')

    nodekeyToAccount
      .mockReturnValueOnce('0xAb2a47301ACa1444Ae4e3c2bC7D4B88afc4Af5f2')
      .mockReturnValueOnce('0x49C1488d2f8Abf1D7AB0a08f2E1308369fDDFbfE')
      .mockReturnValueOnce('0x1760F90FF74aD4d8BBF536D01Fc0afb879c3dCf0')

    executeSync.mockReturnValueOnce('validators')
    generateExtraData(nodes, 'testDir', 'keyPath')
    expect(writeFile).toBeCalledWith(join('testDir', 'istanbul.toml'), expect.anything(), false)
    expect(executeSync).toBeCalledTimes(1)
  })
})
