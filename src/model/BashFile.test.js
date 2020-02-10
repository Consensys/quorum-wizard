import { buildBashScript } from '../generators/bashHelper'
import { createCustomConfig, createQuickstartConfig, createReplica7NodesConfig } from './NetworkConfig'
import { cwd } from '../utils/fileUtils'
import { TEST_CWD } from '../utils/testHelper'
import { generateAccounts } from '../generators/consensusHelper'
import { join } from 'path'

jest.mock('../utils/fileUtils')
jest.mock('../generators/consensusHelper')
cwd.mockReturnValue(TEST_CWD)
generateAccounts.mockReturnValue("accounts")

test('creates quickstart config', () => {
  const config = createQuickstartConfig()
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: false
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: true
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera custom', () => {
  const config = createCustomConfig({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: false,
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: false,
    nodes: [],
    dockerCustom: undefined
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 2nodes istanbul bash tessera cakeshop custom ports', () => {
  let nodes = [
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
      }
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
      }
    }]
  const config = createCustomConfig({
    numberNodes: '2',
    consensus: 'istanbul',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: true,
    generateKeys: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    nodes: nodes,
    dockerCustom: undefined
  })
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})
