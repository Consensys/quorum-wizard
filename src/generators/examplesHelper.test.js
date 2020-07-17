import {
  createNetPath,
  createLibPath,
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import {
  copyFile,
  cwd, libRootDir,
  writeFile,
} from '../utils/fileUtils'
import { generateAndCopyExampleScripts, generateAttachScript, generateRunScript } from './examplesHelper'
import { loadTesseraPublicKey } from './transactionManager'
import { pathToCakeshop, pathToQuorumBinary, pathToTesseraJar } from './binaryHelper'
import SCRIPTS from './scripts'

jest.mock('./binaryHelper')
jest.mock('../utils/fileUtils')
jest.mock('./transactionManager')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
loadTesseraPublicKey.mockReturnValue('publickey')
pathToQuorumBinary.mockReturnValue('path/to/binary')
pathToTesseraJar.mockReturnValue('path/to/binary')
pathToCakeshop.mockReturnValue('path/to/binary')

const CONFIG = {
  network: {
    name: 'test',
  },
  nodes: [{
    quorum: {
      ip: '1.2.3.4',
      rpcPort: '1234',
    },
  }],
}

describe('generates and copies over example scripts', () => {
  it('generates private_contract with node 2 and copies over the 3 example scripts', () => {
    generateAndCopyExampleScripts(CONFIG)
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, SCRIPTS.runscript.filename),
      expect.anything(),
      true,
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, SCRIPTS.attach.filename),
      expect.anything(),
      true,
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, SCRIPTS.publicContract.filename),
      expect.anything(),
      false,
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(CONFIG, SCRIPTS.privateContract.filename),
      expect.anything(),
      false,
    )
    expect(loadTesseraPublicKey).toBeCalledWith(CONFIG, 2)
  })
  it('generates public_contract and copies over the 2 example scripts', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        transactionManager: 'none',
      },
    }
    generateAndCopyExampleScripts(config)
    expect(writeFile).toBeCalledWith(
      createNetPath(config, SCRIPTS.runscript.filename),
      expect.anything(),
      true,
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(config, SCRIPTS.publicContract.filename),
      expect.anything(),
      false,
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
