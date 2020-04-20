import { createConfigFromAnswers } from './NetworkConfig'
import { isJava11Plus } from '../utils/execUtils'

jest.mock('../utils/execUtils')
isJava11Plus.mockReturnValue(false)

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.5.0',
  transactionManager: '0.10.2',
  deployment: 'bash',
  cakeshop: 'none',
}

test('creates quickstart setup', () => {
  const config = createConfigFromAnswers({})
  expect(config).toMatchSnapshot()
})

test('creates quickstart config with java 11+', () => {
  isJava11Plus.mockReturnValue(true)
  const config = createConfigFromAnswers({})
  expect(config).toMatchSnapshot()
  isJava11Plus.mockReturnValue(false)
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
  })
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '5',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: '0.11.0',
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul kubernetes config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    deployment: 'kubernetes',
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
  })
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul cakeshop config', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    cakeshop: '0.11.0',
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
  })
  expect(config).toMatchSnapshot()
})
