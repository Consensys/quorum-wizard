import { createQuickstartConfig, createReplica7NodesConfig, createCustomConfig } from '../../model/NetworkConfig'
import { customize, quickstart, replica7Nodes } from '../../questions'
import { buildBash } from '../../utils/bashHelper'
import { prompt } from 'inquirer'
import { getCustomizedBashNodes } from '../../utils/promptHelper'

jest.mock('inquirer')
jest.mock('../../model/NetworkConfig')
jest.mock('../../utils/bashHelper')
jest.mock('../../utils/dockerHelper')
jest.mock('../../utils/promptHelper')

const REPLICA_7NODES_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  transactionManager: 'tessera',
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
  const fakeConfig = { network: {name: 'test'}}
  createQuickstartConfig.mockReturnValue(fakeConfig)
  await quickstart()
  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})

test('placeholder', async () => {
  const fakeConfig = { network: {name: 'test'}}
  prompt.mockResolvedValue(REPLICA_7NODES_CONFIG)
  createReplica7NodesConfig.mockReturnValue(fakeConfig)
  await replica7Nodes()
  expect(createReplica7NodesConfig)
    .toHaveBeenCalledWith(REPLICA_7NODES_CONFIG)
  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})

test('customize', async () => {
  const fakeConfig = { network: {name: 'test'}}
  const fakeCommands = {tesseraStart: 'test', gethStart: 'test', initStart: ['test'],netPath: 'test',}
  createCustomConfig.mockReturnValue(fakeConfig)
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

  expect(buildBash).toHaveBeenCalledWith(fakeConfig)
})
