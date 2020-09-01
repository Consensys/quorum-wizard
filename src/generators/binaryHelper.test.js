import { any } from 'expect'
import {
  downloadAndCopyBinaries,
  getDownloadableGethChoices,
  getDownloadableTesseraChoices,
  getGethOnPath,
  getTesseraOnPath,
  isQuorum260Plus,
  pathToBootnode,
  pathToCakeshop,
  pathToQuorumBinary,
  pathToTesseraJar,
} from './binaryHelper'
import {
  executeSync,
  isJava11Plus,
} from '../utils/execUtils'
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
  LATEST_BOOTNODE,
  LATEST_CAKESHOP,
  LATEST_QUORUM,
  LATEST_TESSERA,
} from './download'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

jest.mock('../generators/download')
jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
jest.mock('../utils/log')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
wizardHomeDir.mockReturnValue(TEST_WIZARD_HOME_DIR)
downloadIfMissing.mockReturnValue(Promise.resolve())
info.mockReturnValue('log')

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
  it('Returns no choices when local quorum is not found', () => {
    executeSync.mockImplementationOnce(() => {
      throw new Error('Not found')
    })
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    executeSync.mockReturnValueOnce(Buffer.from(''))
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenLastCalledWith('which geth')
  })
  it('Returns no choices when local geth (not quorum) is found', () => {
    executeSync.mockReturnValueOnce(Buffer.from('/usr/bin/geth'))
    executeSync.mockReturnValueOnce(Buffer.from(vanillaGethVersion))
    expect(getGethOnPath()).toEqual([])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    expect(executeSync).toHaveBeenLastCalledWith('geth version')
  })
  it('Returns choice when local quorum is found, parses version', () => {
    executeSync.mockReturnValueOnce(Buffer.from('/usr/bin/geth'))
    executeSync.mockReturnValueOnce(Buffer.from(quorumVersion))
    expect(getGethOnPath()).toEqual([
      {
        name: 'Quorum 2.2.4 on path (/usr/bin/geth)',
        value: 'PATH',
      },
    ])
    expect(executeSync).toHaveBeenCalledWith('which geth')
    expect(executeSync).toHaveBeenLastCalledWith('geth version')
  })
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
    tools: [],
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

describe('presents correct binary options', () => {
  it('presents available geth options for bash', () => {
    const choices = getDownloadableGethChoices('bash')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for docker', () => {
    const choices = getDownloadableGethChoices('docker')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
})

describe('presents the correct binary options', () => {
  it('disables java 11 jars if in bash mode and on jdk 8 or no java', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('Enables if in bash mode and on jdk 11+', () => {
    isJava11Plus.mockReturnValue(true)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('does not disable tessera options in docker mode', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('docker-compose')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('forces and doesnt disable tessera options in kubernetes mode', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('kubernetes')
    expect(choices.some((choice) => choice.name === `Tessera ${LATEST_TESSERA}` && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).not.toBeTruthy()
  })
})

test('tests if quorum version is 2.6.0 or higher', () => {
  expect(isQuorum260Plus('2.6.1')).toBeTruthy()
  expect(isQuorum260Plus('2.6.0')).toBeTruthy()
  expect(isQuorum260Plus('2.5.0')).not.toBeTruthy()
})

test('tests if quorum version on path is 2.6.0 or higher', () => {
  executeSync.mockReturnValueOnce(Buffer.from(quorumVersion26))
  expect(isQuorum260Plus('PATH')).toBeTruthy()
  executeSync.mockReturnValueOnce(Buffer.from(quorumVersion))
  expect(isQuorum260Plus('PATH')).not.toBeTruthy()
})

function overrideProcessValue(key, value) {
  // process.platform is read-only, use this workaround to set it
  Object.defineProperty(process, key, { value })
}

const vanillaGethVersion = `Geth
Version: 1.9.0-unstable
Git Commit: f03402232cd7bcc558b70a20df5b326b1d71e1ad
Architecture: amd64
Protocol Versions: [63 62]
Network Id: 1
Go Version: go1.12
Operating System: darwin
GOPATH=/Users/bradmcdermott/go
GOROOT=/usr/local/Cellar/go/1.12/libexec`

const quorumVersion = `Geth
Version: 1.8.18-stable
Git Commit: d0262e2139ce74d16b127dd3b4ded57fd29e3a73
Quorum Version: 2.2.4
Architecture: amd64
Protocol Versions: [63 62]
Network Id: 1337
Go Version: go1.9.7
Operating System: darwin
GOPATH=/Users/bradmcdermott/go
GOROOT=/usr/local/Cellar/go@1.9/1.9.7/libexec`

const quorumVersion26 = `Geth
Version: 1.9.7-stable
Git Commit: 9339be03f9119ee488b05cf087d103da7e68f053
Git Commit Date: 20200504
Quorum Version: 2.6.0
Architecture: amd64
Protocol Versions: [64 63]
Network Id: 1337
Go Version: go1.13.10
Operating System: darwin
GOPATH=/Users/bradmcdermott/go
GOROOT=/Users/travis/.gimme/versions/go1.13.10.darwin.amd64`
