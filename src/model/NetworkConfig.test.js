import {
  createCustomConfig,
  createQuickstartConfig,
  createReplica7NodesConfig,
} from './NetworkConfig'

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  deployment: 'bash',
  cakeshop: false,
}

test('creates quickstart setup', () => {
  const config = createQuickstartConfig()
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul config', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM config', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    numberNodes: '5',
    transactionManager: 'none',
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul docker config', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    deployment: 'docker-compose',
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    numberNodes: '5',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: true,
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul cakeshop config', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    cakeshop: true,
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom config', () => {
  const config = createCustomConfig({
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
  const config = createCustomConfig({
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
  const config = createCustomConfig({
    ...baseNetwork,
    numberNodes: '6',
    deployment: 'docker-compose',
    generateKeys: true,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom docker config', () => {
  const config = createCustomConfig({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'docker-compose',
    generateKeys: false,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
  })
  expect(config).toMatchSnapshot()
})
