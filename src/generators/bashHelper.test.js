import { anything } from 'expect'
import {
  buildBashScript,
  buildBash,
} from './bashHelper'
import { createConfigFromAnswers } from '../model/NetworkConfig'
import {
  cwd,
  libRootDir,
  readFileToString,
  writeFile,
  copyFile,
  createFolder,
  writeJsonFile,
  exists,
} from '../utils/fileUtils'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
  createNetPath,
  createLibPath,
} from '../utils/testHelper'
import { info } from '../utils/log'
import { generateAccounts } from './consensusHelper'
import { isJava11Plus } from '../utils/execUtils'

jest.mock('../utils/fileUtils')
jest.mock('./consensusHelper')
jest.mock('../utils/execUtils')
jest.mock('../utils/log')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
generateAccounts.mockReturnValue('accounts')
exists.mockReturnValue(true)
readFileToString.mockReturnValue('publicKey')
isJava11Plus.mockReturnValue(false)
info.mockReturnValue('log')

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.5.0',
  transactionManager: '0.10.2',
  cakeshop: 'none',
  deployment: 'bash',
}

test('creates quickstart config', () => {
  const config = createConfigFromAnswers({})
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates quickstart config with java 11+', () => {
  isJava11Plus.mockReturnValue(true)
  const config = createConfigFromAnswers({})
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
  isJava11Plus.mockReturnValue(false)
})

test('creates 3nodes raft bash tessera', () => {
  const config = createConfigFromAnswers(baseNetwork)
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    cakeshop: '0.11.0',
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash no tessera', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    transactionManager: 'none',
  })
  const bash = buildBashScript(config).startScript
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
  const bash = buildBashScript(config).startScript
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
    quorumVersion: '2.5.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: '0.11.0',
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    cakeshopPort: '7999',
    nodes,
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('build bash with tessera', () => {
  const config = createConfigFromAnswers(baseNetwork)
  buildBash(config)
  expect(writeFile).toBeCalledWith(createNetPath(config, 'start.sh'), anything(), true)
  expect(copyFile).toBeCalledWith(createLibPath('lib', 'stop.sh'), createNetPath(config, 'stop.sh'))
})

test('build bash with tessera and cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    cakeshop: '0.11.0',
  })
  buildBash(config)
  expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local'), true)
  expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local'), 'cakeshop.json', anything())
  expect(writeFile).toBeCalledWith(createNetPath(config, 'qdata', 'cakeshop', 'local', 'application.properties'), anything(), false)
  expect(writeFile).toBeCalledWith(createNetPath(config, 'start.sh'), anything(), true)
  expect(copyFile).toBeCalledWith(createLibPath('lib', 'stop.sh'), createNetPath(config, 'stop.sh'))
})

test('build bash remote debug', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    remoteDebug: true,
  })
  buildBash(config)
  expect(writeFile).toBeCalledWith(createNetPath(config, 'start.sh'), anything(), true)
  expect(copyFile).toBeCalledWith(createLibPath('lib', 'stop.sh'), createNetPath(config, 'stop.sh'))
})
