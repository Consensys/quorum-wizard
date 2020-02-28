import { buildBashScript } from './bashHelper'
import { createConfigFromAnswers } from '../model/NetworkConfig'
import {
  cwd,
  libRootDir,
} from '../utils/fileUtils'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import { generateAccounts } from './consensusHelper'
import { isJava11Plus } from '../utils/execUtils'

jest.mock('../utils/fileUtils')
jest.mock('../generators/consensusHelper')
jest.mock('../utils/execUtils')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
generateAccounts.mockReturnValue('accounts')
isJava11Plus.mockReturnValue(false)

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.4.0',
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
    cakeshop: '0.11.0-RC2',
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
    dockerCustom: undefined,
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
        wsPort: '57001',
        raftPort: '80501',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5081',
        p2pPort: '5001',
        enclavePort: '5181',
      },
    },
    {
      quorum: {
        ip: '127.0.0.1',
        devP2pPort: '55001',
        rpcPort: '56001',
        wsPort: '56001',
        raftPort: '80502',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5082',
        p2pPort: '5002',
        enclavePort: '5182',
      },
    },
  ]
  const config = createConfigFromAnswers({
    numberNodes: '2',
    consensus: 'istanbul',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: '0.11.0-RC2',
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    nodes,
    dockerCustom: undefined,
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})
