import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
test('creates 7nodes istanbul config', () => {
  const config = createQuickstartConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: false
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM config', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'raft',
    gethBinary: '2.4.0',
    transactionManager: 'none',
    deployment: 'bash',
    cakeshop: false
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul docker config', () => {
  const config = createQuickstartConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: false
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'raft',
    gethBinary: '2.4.0',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: true
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul cakeshop config', () => {
  const config = createQuickstartConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: true
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom config', () => {
  const config = createCustomConfig({
    numberNodes: '6',
    consensus: 'raft',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: false,
    keyGeneration: true,
    networkId: 10,
    genesisLocation: '',
    defaultPorts: true,
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom config', () => {
  const config = createCustomConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    gethBinary: '2.4.0',
    transactionManager: 'none',
    deployment: 'bash',
    cakeshop: false,
    keyGeneration: true,
    networkId: 12,
    genesisLocation: '',
    defaultPorts: true,
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom docker config', () => {
  const config = createCustomConfig({
    numberNodes: '6',
    consensus: 'raft',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: false,
    keyGeneration: true,
    networkId: 10,
    genesisLocation: 'testDir',
    defaultPorts: true,
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom docker config', () => {
  const config = createCustomConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    gethBinary: '2.4.0',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: false,
    keyGeneration: false,
    networkId: 10,
    genesisLocation: '',
    defaultPorts: true,
  })
  expect(config).toMatchSnapshot()
})
