
import { any } from 'expect'
import {
  downloadAndCopyBinaries,
  getDownloadableGethChoices,
  getDownloadableTesseraChoices,
  getGethOnPath,
  getTesseraOnPath,
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
import { downloadIfMissing } from './download'
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
isJava11Plus.mockReturnValue(false)
info.mockReturnValue('log')

describe('Chooses the right paths to the binaries', () => {
  it('Calls geth binary directly if on path', () => {
    expect(pathToQuorumBinary('PATH')).toEqual('geth')
  })
  it('Calls geth binary in bin folder', () => {
    expect(pathToQuorumBinary('2.5.0')).toEqual(joinPath(wizardHomeDir(), 'bin/quorum/2.5.0/geth'))
  })
  it('Calls tessera using $TESSERA_JAR', () => {
    expect(pathToTesseraJar('PATH')).toEqual('$TESSERA_JAR')
  })
  it('Calls tessera using bin folder jar', () => {
    expect(pathToTesseraJar('0.10.2')).toEqual(joinPath(
      wizardHomeDir(),
      'bin/tessera/0.10.2/tessera-app.jar',
    ))
  })
  it('Calls cakeshop using bin folder war', () => {
    expect(pathToCakeshop('0.11.0')).toEqual(joinPath(wizardHomeDir(), 'bin/cakeshop/0.11.0/cakeshop.war'))
  })
  it('Calls bootnode using bin folder', () => {
    expect(pathToBootnode()).toEqual(joinPath(wizardHomeDir(), 'bin/bootnode/1.8.27/bootnode'))
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
    quorumVersion: '2.5.0',
    transactionManager: '0.10.2',
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
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.5.0')
    expect(downloadIfMissing).toBeCalledWith('tessera', '0.10.2')
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
        cakeshop: '0.11.0',
        generateKeys: true,
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.5.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).toBeCalledWith('istanbul', any(String))
  })
  it('Downloads nothing for raft docker, no keygen', async () => {
    const config = {
      network: {
        ...baseNetwork,
        deployment: 'docker-compose',
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).not.toBeCalledWith('quorum', '2.5.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
  })
  it('Downloads correct bins for docker with keygen', async () => {
    const config = {
      network: {
        ...baseNetwork,
        deployment: 'docker-compose',
        generateKeys: true,
      },
    }
    await downloadAndCopyBinaries(config)
    expect(downloadIfMissing).toBeCalledWith('quorum', '2.5.0')
    expect(downloadIfMissing).toBeCalledWith('tessera', '0.10.2')
    expect(downloadIfMissing).not.toBeCalledWith('cakeshop', any(String))
    expect(downloadIfMissing).toBeCalledWith('bootnode', any(String))
    expect(downloadIfMissing).not.toBeCalledWith('istanbul', any(String))
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
    expect(downloadIfMissing).not.toBeCalledWith('quorum', '2.5.0')
    expect(downloadIfMissing).not.toBeCalledWith('tessera', '0.10.2')
  })
})

describe('presents correct binary options', () => {
  it('presents available geth options for bash', () => {
    const choices = getDownloadableGethChoices('bash')
    expect(choices.some((choice) => choice.name === 'Quorum 2.5.0' && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for docker', () => {
    const choices = getDownloadableGethChoices('docker')
    expect(choices.some((choice) => choice.name === 'Quorum 2.5.0' && choice.disabled === false)).toBeTruthy()
  })
})

describe('presents the correct binary options', () => {
  it('disables 0.10.4 if in bash mode and on jdk 8', () => {
    isJava11Plus.mockReturnValue(false)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.4' && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.2' && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('disables 0.10.2 if in bash mode and on jdk 11+', () => {
    isJava11Plus.mockReturnValue(true)
    const choices = getDownloadableTesseraChoices('bash')
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.4' && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.2' && typeof choice.disabled === 'string')).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
  it('does not disable tessera options in docker mode', () => {
    const choices = getDownloadableTesseraChoices('docker-compose')
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.4' && choice.disabled === false)).toBeTruthy()
    expect(choices.some((choice) => choice.name === 'Tessera 0.10.2' && choice.disabled === false)).toBeTruthy()
    expect(choices.includes('none')).toBeTruthy()
  })
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
