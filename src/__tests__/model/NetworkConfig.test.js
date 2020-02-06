import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
test('creates 7nodes istanbul config', () => {
  const config = createQuickstartConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'tessera',
    deployment: 'bash',
    cakeshop: false
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM config', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'raft',
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
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: false
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'raft',
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
    transactionManager: 'tessera',
    deployment: 'bash',
    cakeshop: true
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom config', () => {
  const config = createCustomConfig({
    numberNodes: '6',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'bash',
    cakeshop: false,
    generateKeys: true,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
    nodes: [],
    dockerCustom: undefined
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom config', () => {
  const config = createCustomConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'bash',
    cakeshop: false,
    generateKeys: true,
    networkId: 12,
    genesisLocation: '',
    customizePorts: false,
    nodes: [],
    dockerCustom: undefined
  })
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom docker config', () => {
  const config = createCustomConfig({
    numberNodes: '6',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: false,
    generateKeys: true,
    networkId: 10,
    genesisLocation: 'testDir',
    customizePorts: false,
    nodes: [],
    dockerCustom: undefined
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom docker config', () => {
  const config = createCustomConfig({
    numberNodes: '7',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: false,
    generateKeys: false,
    networkId: 10,
    genesisLocation: '',
    customizePorts: false,
    nodes: [],
    dockerCustom: undefined
  })
  expect(config).toMatchSnapshot()
})
