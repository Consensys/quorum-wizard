import * as fileUtils from '../../utils/fileUtils'
import { createNetwork } from '../../utils/networkCreator'
import { createQuickstartConfig } from '../../model/NetworkConfig'

jest.mock('../../utils/fileUtils', () => ({
  copyFile: jest.fn(),
  createFolder: jest.fn(),
  removeFolder: jest.fn(),
  writeFile: jest.fn(),
  writeJsonFile: jest.fn()
}))

test.skip('placeholder', () => {
  let config = createQuickstartConfig('5', 'raft', 'bash')
  createNetwork(config)
  expect(fileUtils.copyFile).toBeCalled()
})
