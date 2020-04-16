import { getFullNetworkPath } from './networkCreator'
import {
  createConfigFromAnswers,
} from '../model/NetworkConfig'
import {
  cwd,
  libRootDir,
  readFileToString,
  writeFile,
  copyScript,
  createFolder,
  copyDirectory,
} from '../utils/fileUtils'
import {
  createKubernetes,
  buildKubernetes,
} from './kubernetesHelper'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
  createLibPath,
} from '../utils/testHelper'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

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
  quorumVersion: '2.5.0',
  transactionManager: '0.10.2',
  cakeshop: '0.11.0',
  deployment: 'kubernetes',
}

describe('generates kubernetes directory', () => {
  it('given kubernetes details builds files to run kubernetes', async () => {
    const config = createConfigFromAnswers(baseNetwork)

    readFileToString.mockReturnValueOnce('test')
    await createKubernetes(config)

    expect(createFolder).toBeCalledWith(joinPath(getFullNetworkPath(), 'out', 'config'), true)
    expect(copyDirectory).toBeCalledWith(createLibPath('7nodes'), joinPath(getFullNetworkPath(), 'out', 'config'))

    expect(copyScript).toBeCalledWith(
      createLibPath('lib', 'quorum-init'),
      joinPath(getFullNetworkPath(), 'quorum-init'),
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'qubernetes.yaml'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'start.sh'),
      expect.anything(),
      true,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'stop.sh'),
      expect.anything(),
      true,
    )
  })
  it('given kubernetes details builds files to run kubernetes', async () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      cakeshop: 'none',
      transactionManager: 'none',
    })

    readFileToString.mockReturnValueOnce('test')
    await createKubernetes(config)

    expect(createFolder).toBeCalledWith(joinPath(getFullNetworkPath(), 'out', 'config'), true)
    expect(copyDirectory).toBeCalledWith(createLibPath('7nodes'), joinPath(getFullNetworkPath(), 'out', 'config'))

    expect(copyScript).toBeCalledWith(
      createLibPath('lib', 'quorum-init'),
      joinPath(getFullNetworkPath(), 'quorum-init'),
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'qubernetes.yaml'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'start.sh'),
      expect.anything(),
      true,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'stop.sh'),
      expect.anything(),
      true,
    )
  })

  it('given kubernetes details builds files to run kubernetes with keygen', async () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      cakeshop: 'none',
      transactionManager: 'none',
      generateKeys: true,
    })

    readFileToString.mockReturnValueOnce('test')
    await createKubernetes(config)

    expect(copyScript).toBeCalledWith(
      createLibPath('lib', 'quorum-init'),
      joinPath(getFullNetworkPath(), 'quorum-init'),
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'qubernetes.yaml'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'start.sh'),
      expect.anything(),
      true,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'stop.sh'),
      expect.anything(),
      true,
    )
  })
})

test('creates 5nodes raft kubernetes tessera', () => {
  const config = createConfigFromAnswers(baseNetwork)
  const kubernetes = buildKubernetes(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 5nodes istanbul kubernetes no tessera', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    transactionManager: 'none',
    cakeshop: 'none',
  })
  const kubernetes = buildKubernetes(config)
  expect(kubernetes).toMatchSnapshot()
})
