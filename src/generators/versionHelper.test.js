import {
  getGethOnPath,
  getDownloadableGethChoices,
} from './versionHelper'
import { executeSync } from '../utils/execUtils'
import {
  getVersionsBintray,
  LATEST_QUORUM,
} from './download'

jest.mock('../utils/execUtils')
jest.mock('./download')

getVersionsBintray.mockReturnValue([LATEST_QUORUM])

describe('presents correct binary options', () => {
  it('presents available geth options for bash', async () => {
    const choices = await getDownloadableGethChoices('bash')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
  })
  it('presents available geth options for docker', async () => {
    const choices = await getDownloadableGethChoices('docker')
    expect(choices.some((choice) => choice.name === `Quorum ${LATEST_QUORUM}` && choice.disabled === false)).toBeTruthy()
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
})

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
