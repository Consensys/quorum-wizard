import { overrideProcessValue } from '../utils/testHelper'
import { getPlatformSpecificUrl } from './download'

describe('Handles different binary file urls', () => {
  let originalPlatform
  beforeAll(() => {
    originalPlatform = process.platform
  })
  afterAll(() => {
    overrideProcessValue('platform', originalPlatform)
  })
  it('Works with cross-platform single urls', () => {
    expect(getPlatformSpecificUrl(crossPlatform)).toEqual('crossplatform_url')
  })
  it('Works with multiple platform urls', () => {
    overrideProcessValue('platform', 'linux')
    expect(getPlatformSpecificUrl(multiplePlatform)).toEqual('linux_url')
    overrideProcessValue('platform', 'darwin')
    expect(getPlatformSpecificUrl(multiplePlatform)).toEqual('mac_url')
  })
  it('Throws an error when using an unsupported platform', () => {
    overrideProcessValue('platform', 'windows_nt')
    expect(() => getPlatformSpecificUrl(multiplePlatform))
      .toThrow(new Error('Sorry, your platform (windows_nt) is not supported.'))
  })
})

const crossPlatform = {
  name: 'file.jar',
  url: 'crossplatform_url',
  type: 'jar',
}

const multiplePlatform = {
  name: 'compiled_bin',
  url: {
    darwin: 'mac_url',
    linux: 'linux_url',
  },
  type: 'tar.gz',
  files: [
    'compiled_bin',
  ],
}
