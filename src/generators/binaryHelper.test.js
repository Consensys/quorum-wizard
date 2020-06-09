
import { any } from 'expect'
import {
  downloadAndCopyBinaries,
  getDownloadableTesseraChoices,
  getTesseraOnPath,
  pathToBootnode,
  pathToCakeshop,
  pathToQuorumBinary,
  pathToTesseraJar,
} from './binaryHelper'
import { isJava11Plus } from '../utils/execUtils'
import {
  cwd,
  libRootDir,
  wizardHomeDir,
} from '../utils/fileUtils'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
  TEST_WIZARD_HOME_DIR,
} from '../utils/testHelper'
import {
  downloadIfMissing,
  createQuorumBinaryInfo,
  createCakeshopBinaryInfo,
  LATEST_BOOTNODE,
  LATEST_CAKESHOP,
  LATEST_QUORUM,
  LATEST_TESSERA,
  LATEST_TESSERA_J8,
} from './download'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import { getLatestCakeshop } from './versionHelper'
// import { disableIfWrongJavaVersion } from '../questions/validators'

jest.mock('../generators/download')
jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
jest.mock('../utils/log')
jest.mock('./versionHelper')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
wizardHomeDir.mockReturnValue(TEST_WIZARD_HOME_DIR)
downloadIfMissing.mockReturnValue(Promise.resolve())
isJava11Plus.mockReturnValue(false)
info.mockReturnValue('log')
getLatestCakeshop.mockReturnValue(LATEST_CAKESHOP)

const QUORUM_BINARY_INFO = {
  name: 'geth',
}

const CAKESHOP_BINARY_INFO = {
  name: 'cakeshop.war',
}
createQuorumBinaryInfo.mockReturnValue(QUORUM_BINARY_INFO)
createCakeshopBinaryInfo.mockReturnValue(CAKESHOP_BINARY_INFO)

describe('Chooses the right paths to the binaries', () => {
  it('Calls geth binary directly if on path', () => {
    expect(pathToQuorumBinary('PATH')).toEqual('geth')
  })
  it('Calls geth binary in bin folder', () => {
    expect(pathToQuorumBinary(LATEST_QUORUM)).toEqual(joinPath(wizardHomeDir(), 'bin/quorum', LATEST_QUORUM, 'geth'))
  })
  it('Calls tessera using $TESSERA_JAR', () => {
    expect(pathToTesseraJar('PATH')).toEqual('$TESSERA_JAR')
  })
  it('Calls tessera using bin folder jar', () => {
    expect(pathToTesseraJar(LATEST_TESSERA)).toEqual(joinPath(
      wizardHomeDir(),
      'bin/tessera', LATEST_TESSERA, 'tessera-app.jar',
    ))
  })
  it('Calls cakeshop using bin folder war', () => {
    expect(pathToCakeshop(LATEST_CAKESHOP)).toEqual(joinPath(wizardHomeDir(), 'bin/cakeshop', LATEST_CAKESHOP, 'cakeshop.war'))
  })
  it('Calls bootnode using bin folder', () => {
    expect(pathToBootnode()).toEqual(joinPath(wizardHomeDir(), 'bin/bootnode', LATEST_BOOTNODE, 'bootnode'))
  })
})

describe('Finds binaries on path', () => {
  it('Returns no choices when $TESSERA_JAR not set', () => {
    const originalEnv = process.env
    overrideProcessValue('env', { TESSERA_JAR: '' })
    expect(getTesseraOnPath()).toEqual([])
    overrideProcessValue('env', originalEnv)
  })
  it('Returns choice when $TESSERA_JAR is set', () => {
    const originalEnv = process.env
    overrideProcessValue('env', { TESSERA_JAR: '/path/to/jar' })
    expect(getTesseraOnPath()).toEqual([
      {
        name: 'Tessera at $TESSERA_JAR (/path/to/jar)',
        value: 'PATH',
      },
    ])
    overrideProcessValue('env', originalEnv)
  })
})

describe('Downloads binaries', () => {
  const baseNetwork = {
    quorumVersion: LATEST_QUORUM,
    transactionManager: LATEST_TESSERA,
    cakeshop: 'none',
    consensus: 'raft',
    generateKeys: false,
    deployment: 'bash',
  }
  beforeEach(() => {
    downloadIfMissing.mockClear()
  })
  it('Downloads correct bins for raft tessera', async () => {
    const config = {
      network: {
        ...baseNetwork,
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', LATEST_QUORUM)
    expect(downloadIfMissing).toBeCalledWith('tessera', LATEST_TESSERA)
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
  })
  it('Downloads correct bins for istanbul + keygen + cakeshop, just quorum', async () => {
    const config = {
      network: {
        ...baseNetwork,
        transactionManager: 'none',
        consensus: 'istanbul',
        cakeshop: LATEST_CAKESHOP,
        generateKeys: true,
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', LATEST_QUORUM)
    expect(downloadIfMissing).not.toBeCalledWith('tessera', LATEST_TESSERA)
    expect(downloadIfMissing).toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).toBeCalledWith('istanbul', any(String))
  })
  it('Does not download geth and tessera when on path', async () => {
    const config = {
      network: {
        ...baseNetwork,
        quorumVersion: 'PATH',
        transactionManager: 'PATH',
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).not.toBeCalledWith('quorum', LATEST_QUORUM)
    expect(downloadIfMissing).not.toBeCalledWith('tessera', LATEST_TESSERA)
  })
})

describe('presents the correct binary options', () => {
  it('disables java 11 jars if in bash mode and on jdk 8', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('disables 0.10.2 if in bash mode and on jdk 11+', () => {
    isJava11Plus.mockReturnValue(true)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('does not disable tessera options in docker mode', () => {
    const choices = getDownloadableTesseraChoices('docker-compose')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('forces and doesnt disable tessera options in kubernetes mode', () => {
    const choices = getDownloadableTesseraChoices('kubernetes')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA_J8}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).not.toBeTruthy()
  })
})

function overrideProcessValue(key, value) {
  // process.platform is read-only, use this workaround to set it
  Object.defineProperty(process, key, { value })
}
