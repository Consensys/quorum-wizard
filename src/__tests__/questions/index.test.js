import inquirer from 'inquirer'
import { quickstart } from '../../questions'
import * as NetworkConfig from '../../model/NetworkConfig'
import * as networkCreator from '../../utils/networkCreator'

jest.mock('inquirer')
jest.mock('../../model/NetworkConfig', () => ({
  createQuickstartConfig: jest.fn()
}))
jest.mock('../../utils/networkCreator', () => ({
  createNetwork: jest.fn()
}))

const QUICKSTART_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  deployment: 'bash'
}

test('placeholder', async () => {
  const fakeConfig = { test: 'test'}
  NetworkConfig.createQuickstartConfig.mockReturnValue(fakeConfig)
  inquirer.prompt.mockResolvedValue(QUICKSTART_CONFIG)
  await quickstart()
  expect(NetworkConfig.createQuickstartConfig)
  .toHaveBeenCalledWith(
    QUICKSTART_CONFIG.numberNodes,
    QUICKSTART_CONFIG.consensus,
    QUICKSTART_CONFIG.deployment
  )
  expect(networkCreator.createNetwork).toHaveBeenCalledWith(fakeConfig)
})
