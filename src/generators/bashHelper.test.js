import { anything } from 'expect'
import {
  initBash,
  startScriptBash,
} from './bashHelper'
import { createConfigFromAnswers } from '../model/NetworkConfig'
import {
  cwd,
  getOutputPath,
  libRootDir,
  readFileToString,
  writeFile,
  createFolder,
  writeJsonFile,
  wizardHomeDir,
} from '../utils/fileUtils'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
  TEST_WIZARD_HOME_DIR,
  createNetPath,
} from '../utils/testHelper'
import { info } from '../utils/log'
import { generateAccounts } from './consensusHelper'
import {
  LATEST_QUORUM, LATEST_TESSERA,
} from './download'

jest.mock('../utils/fileUtils')
jest.mock('./consensusHelper')
jest.mock('../utils/execUtils')
jest.mock('../utils/log')
getOutputPath.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
wizardHomeDir.mockReturnValue(TEST_WIZARD_HOME_DIR)
generateAccounts.mockReturnValue('accounts')
readFileToString.mockReturnValue('publicKey')
info.mockReturnValue('log')

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  tools: [],
  deployment: 'bash',
}

test('creates quickstart config', () => {
  const config = createConfigFromAnswers({})
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates quickstart start script without insecure unlock flag on quorum pre-2.6.0', () => {
  const config = createConfigFromAnswers({ quorumVersion: '2.5.0' })
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera', () => {
  const config = createConfigFromAnswers(baseNetwork)
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    tools: ['cakeshop'],
  })
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash no tessera', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    transactionManager: 'none',
  })
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera custom', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: false,
    nodes: [],
  })
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('creates 2nodes istanbul bash tessera cakeshop custom ports', () => {
  const nodes = [
    {
      quorum: {
        ip: '127.0.0.1',
        devP2pPort: '55001',
        rpcPort: '56000',
        wsPort: '57000',
        raftPort: '80501',
        graphQlPort: '58000',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5081',
        p2pPort: '5001',
      },
    },
    {
      quorum: {
        ip: '127.0.0.1',
        devP2pPort: '55001',
        rpcPort: '56001',
        wsPort: '57001',
        raftPort: '80502',
        graphQlPort: '58001',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5082',
        p2pPort: '5002',
      },
    },
  ]
  const config = createConfigFromAnswers({
    numberNodes: '2',
    consensus: 'istanbul',
    quorumVersion: LATEST_QUORUM,
    transactionManager: LATEST_TESSERA,
    deployment: 'bash',
    tools: ['cakeshop'],
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    cakeshopPort: '7999',
    nodes,
  })
  const bash = startScriptBash(config)
  expect(bash).toMatchSnapshot()
})

test('build bash with tessera and cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    tools: ['cakeshop'],
  })
  initBash(config)
  expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local'), true)
  expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local'), 'cakeshop.json', anything())
  expect(writeFile).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local', 'application.properties'), anything(), false)
})
