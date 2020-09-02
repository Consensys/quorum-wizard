import { createConfigFromAnswers } from './NetworkConfig'
import { LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'

jest.mock('../utils/execUtils')

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  tools: [],
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
    tools: ['cakeshop'],
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
    tools: ['cakeshop'],
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
