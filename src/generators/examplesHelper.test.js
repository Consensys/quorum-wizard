import {
  createNetPath,
  createLibPath,
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import {
  copyFile,
  getOutputPath,
  libRootDir,
  writeFile,
} from '../utils/fileUtils'
import { generateAndCopyExampleScripts, generateAttachScript, generateRunScript } from './examplesHelper'
import { loadTesseraPublicKey } from './transactionManager'
import { setEnvironmentCommand } from './bashHelper'

jest.mock('./bashHelper')
jest.mock('../utils/fileUtils')
jest.mock('./transactionManager')
getOutputPath.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
loadTesseraPublicKey.mockReturnValue('publickey')
setEnvironmentCommand.mockReturnValue('BIN_GETH=path/to/binary')

const CONFIG = {
  network: {
    name: 'test',
    networkPath: TEST_CWD,
  },
  nodes: [{
    quorum: {
      ip: '1.2.3.4',
      rpcPort: '1234',
    },
  }],
}

describe('generates and copies over example scripts', () => {
  it('generates private-contract with node 2 and copies over the 3 example scripts', () => {
    generateAndCopyExampleScripts(CONFIG)
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, 'runscript.sh'),
      expect.anything(),
      true,
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, 'attach.sh'),
      expect.anything(),
      true,
    )
    expect(copyFile).toBeCalledWith(
      createLibPath('lib', 'public_contract.js'),
      createNetPath(CONFIG, 'public_contract.js'),
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, 'private_contract.js'),
      expect.anything(),
    )
    expect(loadTesseraPublicKey).toBeCalledWith(CONFIG, 2)
  })
  it('generates public-contract and copies over the 2 example scripts', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        transactionManager: 'none',
      },
    }
    generateAndCopyExampleScripts(config)
    expect(writeFile).toBeCalledWith(
      createNetPath(config, 'runscript.sh'),
      expect.anything(),
      true,
    )
    expect(copyFile).toBeCalledWith(
      createLibPath('lib', 'public_contract.js'),
      createNetPath(config, 'public_contract.js'),
    )
  })
  it('generates the runscript and attach shell scripts for bash', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'bash',
      },
    }
    expect(generateRunScript(config)).toMatchSnapshot()
    expect(generateAttachScript(config)).toMatchSnapshot()
  })
  it('generates the runscript and attach shell scripts for docker', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'docker-compose',
      },
    }
    expect(generateRunScript(config)).toMatchSnapshot()
    expect(generateAttachScript(config)).toMatchSnapshot()
  })
  it('generates the runscript and attach shell scripts for kubernetes', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'kubernetes',
      },
    }
    expect(generateRunScript(config)).toMatchSnapshot()
    expect(generateAttachScript(config)).toMatchSnapshot()
  })
})
