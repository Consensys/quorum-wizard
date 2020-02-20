import { join } from 'path'
import { anything } from 'expect'
import { TEST_CWD, TEST_LIB_ROOT_DIR } from '../utils/testHelper'
import { cwd, copyFile, libRootDir, writeFile } from '../utils/fileUtils'
import { generateAndCopyExampleScripts } from './examplesHelper'

jest.mock('../utils/fileUtils')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)

describe('generates and copies over example scripts', () => {
  it('generates private-contract and copies over the 3 example scripts', () => {
    const config = {
      network: {
        name: 'test'
      }
    }
    generateAndCopyExampleScripts('pubKey', createNetPath(config))
    expect(copyFile).toBeCalledWith(createLibPath('lib/runscript.sh'), createNetPath(config, 'runscript.sh'))
    expect(copyFile).toBeCalledWith(createLibPath('lib/public-contract.js'), createNetPath(config, 'public-contract.js'))
    expect(writeFile).toBeCalledWith(createNetPath(config, 'private-contract.js'), expect.anything())
  })
})

function createLibPath(...relativePaths) {
  return join(libRootDir(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(cwd(), 'network', config.network.name, ...relativePaths)
}
