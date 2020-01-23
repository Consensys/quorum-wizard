import inquirer from 'inquirer'
import { quickstart } from '../../questions'
import * as NetworkConfig from '../../model/NetworkConfig'
import * as networkCreator from '../../utils/networkCreator'
import { copyFile, writeFile, readFileToString } from '../../utils/fileUtils'
import { join } from 'path'
import { anything } from 'expect'
import { execute } from '../../utils/execUtils'

jest.mock('inquirer')
jest.mock('../../model/NetworkConfig')
jest.mock('../../utils/networkCreator')
jest.mock('../../utils/fileUtils')
jest.mock('../../utils/execUtils')

const QUICKSTART_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  transactionManager: 'tessera',
  deployment: 'bash',
  cakeshop: 'no'
}

test('placeholder', async () => {
  const fakeConfig = { test: 'test' }
  const fakeCommands = {tesseraStart: 'test', gethStart: 'test', initStart: ['test'],netPath: 'test',}
  NetworkConfig.createQuickstartConfig.mockReturnValue(fakeConfig)
  inquirer.prompt.mockResolvedValue(QUICKSTART_CONFIG)
  networkCreator.createDirectory.mockReturnValue(fakeCommands)
  await quickstart()
  expect(NetworkConfig.createQuickstartConfig)
  .toHaveBeenCalledWith(
    QUICKSTART_CONFIG.numberNodes,
    QUICKSTART_CONFIG.consensus,
    QUICKSTART_CONFIG.transactionManager,
    QUICKSTART_CONFIG.deployment,
    QUICKSTART_CONFIG.cakeshop
  )
  expect(networkCreator.createDirectory).toHaveBeenCalledWith(fakeConfig)
  expect(writeFile).toBeCalledWith('test/start.sh', expect.any(String), true)
  expect(copyFile).toBeCalledTimes(4)
})
