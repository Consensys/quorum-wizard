import { anything } from 'expect'
import { createConfigFromAnswers } from '../model/NetworkConfig'
import {
  createFolder,
  getOutputPath,
  libRootDir,
  writeJsonFile,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { buildCakeshopDir } from './cakeshopHelper'
import {
  createNetPath,
  createLibPath,
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import { LATEST_QUORUM, LATEST_TESSERA } from './download'

jest.mock('../utils/fileUtils')
getOutputPath.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)

describe('creates a cakeshop directory structure for bash', () => {
  const baseNetwork = {
    numberNodes: '5',
    consensus: 'raft',
    quorumVersion: LATEST_QUORUM,
    transactionManager: LATEST_TESSERA,
    tools: ['cakeshop'],
    deployment: 'bash',
  }
  it('creates directory structure for cakeshop files and moves them in', () => {
    const config = createConfigFromAnswers(baseNetwork)

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'), true)
    expect(writeJsonFile).toBeCalledWith(
      createNetPath(config, 'qdata/cakeshop/local'),
      'cakeshop.json',
      anything(),
    )
    expect(readFileToString).toBeCalledWith(
      createLibPath(
        'lib',
        'cakeshop_application.properties.template',
      ),
    )
    expect(writeFile).toBeCalledWith(
      createNetPath(config, 'qdata/cakeshop/local/application.properties'),
      anything(),
      false,
    )
  })
})
