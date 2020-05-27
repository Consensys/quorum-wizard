import { createConfigFromAnswers, isQuorum260Plus } from './NetworkConfig'
import { isJava11Plus } from '../utils/execUtils'
import { LATEST_CAKESHOP, LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'
import { getPathGethVersion } from '../generators/binaryHelper'

jest.mock('../generators/binaryHelper')
jest.mock('../utils/execUtils')
isJava11Plus.mockReturnValue(true)

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  cakeshop: 'none',
}

const containerPortInfo = {
  quorum: {
    rpcPort: 8545,
    p2pPort: 21000,
    raftPort: 50400,
    wsPort: 8645,
  },
  tm: {
    p2pPort: 9000,
    thirdPartyPort: 9080,
  },
}

test('creates quickstart config', () => {
  const config = createConfigFromAnswers({})
  expect(config).toMatchSnapshot()
})

test('creates quickstart setup with java 8', () => {
  isJava11Plus.mockReturnValue(false)
  const config = createConfigFromAnswers({})
  expect(config).toMatchSnapshot()
  isJava11Plus.mockReturnValue(true)
})

test('creates 7nodes istanbul config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '5',
    transactionManager: 'none',
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul docker config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    deployment: 'docker-compose',
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '5',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: LATEST_CAKESHOP,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul kubernetes config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    deployment: 'kubernetes',
    containerPorts: {
      dockerSubnet: '',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes raft kubernetes custom config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    deployment: 'kubernetes',
    generateKeys: true,
    networkId: 14,
    genesisLocation: '',
    customizePorts: false,
    containerPorts: {
      dockerSubnet: '',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul cakeshop config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    cakeshop: LATEST_CAKESHOP,
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '6',
    generateKeys: true,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'none',
    generateKeys: true,
    networkId: 12,
    genesisLocation: '',
    customizePorts: false,
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom docker config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '6',
    deployment: 'docker-compose',
    generateKeys: true,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom docker config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'docker-compose',
    generateKeys: false,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  expect(config).toMatchSnapshot()
})

test('tests if quorum version is 2.6.0 or higher', () => {
  expect(isQuorum260Plus('2.6.1')).toBeTruthy()
  expect(isQuorum260Plus('2.6.0')).toBeTruthy()
  expect(isQuorum260Plus('2.5.0')).not.toBeTruthy()
})

test('tests if quorum version on path is 2.6.0 or higher', () => {
  getPathGethVersion.mockReturnValueOnce('2.6.0')
  expect(isQuorum260Plus('PATH')).toBeTruthy()
  getPathGethVersion.mockReturnValueOnce('2.5.0')
  expect(isQuorum260Plus('PATH')).not.toBeTruthy()
})
