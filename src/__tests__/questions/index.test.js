import inquirer from 'inquirer'
import { quickstart, customize } from '../../questions'
import * as NetworkConfig from '../../model/NetworkConfig'
import * as networkCreator from '../../utils/networkCreator'
import { copyFile, writeFile, readFileToString } from '../../utils/fileUtils'
import { join } from 'path'
import { anything } from 'expect'
import { execute } from '../../utils/execUtils'
import * as prompt from '../../utils/promptHelper'

jest.mock('inquirer')
jest.mock('../../model/NetworkConfig')
jest.mock('../../utils/networkCreator')
jest.mock('../../utils/fileUtils')
jest.mock('../../utils/execUtils')
jest.mock('../../utils/promptHelper')

const QUICKSTART_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  transactionManager: 'tessera',
  deployment: 'bash',
  cakeshop: false
}

const CUSTOM_CONFIG = {
  numberNodes: '5',
  consensus: 'raft',
  transactionManager: 'none',
  deployment: 'docker-compose',
  cakeshop: false,
  keyGeneration: false,
  networkId: 10,
  genesisLocation: 'testDir',
  defaultPorts: false,
  nodes: ['nodes']
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
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/stop.sh'), "test/stop.sh")
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/runscript.sh'), "test/runscript.sh")
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/public-contract.js'), "test/public-contract.js")
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/private-contract.js'), "test/private-contract.js")

})

test('customize', async () => {
  const fakeConfig = { test: 'test' }
  const fakeCommands = {tesseraStart: 'test', gethStart: 'test', initStart: ['test'],netPath: 'test',}
  NetworkConfig.createCustomConfig.mockReturnValue(fakeConfig)
  inquirer.prompt.mockResolvedValueOnce(QUICKSTART_CONFIG)
  inquirer.prompt.mockResolvedValueOnce(CUSTOM_CONFIG)
  prompt.getPorts.mockReturnValueOnce(['nodes'])
  networkCreator.createDirectory.mockReturnValue(fakeCommands)
  await customize()
  expect(NetworkConfig.createCustomConfig)
  .toHaveBeenCalledWith(
    QUICKSTART_CONFIG.numberNodes,
    QUICKSTART_CONFIG.consensus,
    QUICKSTART_CONFIG.transactionManager,
    QUICKSTART_CONFIG.deployment,
    QUICKSTART_CONFIG.cakeshop,
    CUSTOM_CONFIG.keyGeneration,
    CUSTOM_CONFIG.networkId,
    CUSTOM_CONFIG.genesisLocation,
    CUSTOM_CONFIG.defaultPorts,
    CUSTOM_CONFIG.nodes
  )
  expect(networkCreator.createDirectory).toHaveBeenCalledWith(fakeConfig)
  expect(writeFile).toBeCalledWith('test/start.sh', expect.any(String), true)

  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/runscript.sh'), "test/runscript.sh")
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/public-contract.js'), "test/public-contract.js")
  expect(copyFile).toBeCalledWith(join(process.cwd(), 'lib/private-contract.js'), "test/private-contract.js")

})
