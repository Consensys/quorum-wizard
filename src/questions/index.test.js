import { createQuickstartConfig, createReplica7NodesConfig, createCustomConfig, isBash, isTessera, isDocker } from '../model/NetworkConfig'
import { customize, quickstart, replica7Nodes } from './index'
import { buildBash } from '../generators/bashHelper'
import { prompt } from 'inquirer'
import { getCustomizedBashNodes } from './promptHelper'
import { createDirectory } from '../generators/networkCreator'

jest.mock('inquirer')
jest.mock('../model/NetworkConfig')
jest.mock('../generators/bashHelper')
jest.mock('../generators/dockerHelper')
jest.mock('../questions/promptHelper')
jest.mock('../generators/networkCreator')

const REPLICA_7NODES_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  deployment: 'bash',
  cakeshop: false
}

const CUSTOM_CONFIG = {
  generateKeys: false,
  networkId: 10,
  genesisLocation: 'testDir',
  customizePorts: true,
  nodes: ['nodes']
}

test('quickstart', async () => {
  const fakeConfig = { network: {name: 'test'}, nodes: []}
  createQuickstartConfig.mockReturnValue(fakeConfig)
  isBash.mockReturnValueOnce(true)
  isDocker.mockReturnValueOnce(false)
  await quickstart()
  expect(createQuickstartConfig).toHaveBeenCalled()
  expect(createDirectory).toHaveBeenCalledWith(fakeConfig)
  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})

test('7nodes replica', async () => {
  const fakeConfig = { network: {name: 'test'}, nodes: []}
  prompt.mockResolvedValue(REPLICA_7NODES_CONFIG)
  createReplica7NodesConfig.mockReturnValue(fakeConfig)
  isBash.mockReturnValueOnce(true)
  isDocker.mockReturnValueOnce(false)
  await replica7Nodes()
  expect(createReplica7NodesConfig)
    .toHaveBeenCalledWith(REPLICA_7NODES_CONFIG)
  expect(createDirectory).toHaveBeenCalledWith(fakeConfig)
  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})

test('customize', async () => {
  const fakeConfig = { network: {name: 'test'}, nodes: []}
  createCustomConfig.mockReturnValue(fakeConfig)
  isBash.mockReturnValueOnce(true)
  isTessera.mockReturnValueOnce(true)
  isDocker.mockReturnValueOnce(false)
  prompt.mockResolvedValueOnce(REPLICA_7NODES_CONFIG)
  prompt.mockResolvedValueOnce(CUSTOM_CONFIG)
  getCustomizedBashNodes.mockReturnValueOnce(['nodes'])
  await customize()
  let combinedAnswers = {
    ...REPLICA_7NODES_CONFIG,
    ...CUSTOM_CONFIG,
    nodes: ['nodes'],
  }
  expect(createCustomConfig).toHaveBeenCalledWith(combinedAnswers)
  expect(createDirectory).toHaveBeenCalledWith(fakeConfig)
  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})
