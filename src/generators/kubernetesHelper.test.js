import { getFullNetworkPath } from './networkCreator'
import {
  createConfigFromAnswers,
} from '../model/NetworkConfig'
import {
  cwd, FILES,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { createKubernetes } from './kubernetesHelper'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import { LATEST_QUORUM, LATEST_TESSERA } from './download'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkCreator')
jest.mock('../utils/log')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)
info.mockReturnValue('log')

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  cakeshop: 'none',
  deployment: 'kubernetes',
}

describe('generates kubernetes directory', () => {
  it('given kubernetes details builds files to run kubernetes', async () => {
    const config = createConfigFromAnswers(baseNetwork)

    readFileToString.mockReturnValueOnce('test')
    await createKubernetes(config)

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), FILES.start),
      expect.anything(),
      true,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), FILES.stop),
      expect.anything(),
      true,
    )
  })
})
