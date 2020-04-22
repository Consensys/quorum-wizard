import { homedir } from 'os'
import { join } from 'path'
import { existsSync, removeSync } from 'fs-extra'
import { removeFolder, wizardHomeDir } from './fileUtils'
import { joinPath, verifyPathInsideDirectory } from './pathUtils'

jest.mock('fs-extra')
jest.mock('os')
jest.mock('./pathUtils')
existsSync.mockReturnValue(true)
homedir.mockReturnValue('/path/to/user/home')


describe('safely removes network folder', () => {
  it('does not try to remove when verification throws error', () => {
    const networkPath = '/fake/path'
    verifyPathInsideDirectory.mockImplementation(() => {
      throw new Error('some error')
    })
    expect(() => removeFolder(networkPath)).toThrow(new Error('some error'))
    expect(removeSync).not.toHaveBeenCalled()
  })
  it('does try to remove when verification succeeds', () => {
    verifyPathInsideDirectory.mockImplementation(() => {
      // do nothing
    })
    const networkPath = '/fake/path'
    expect(() => removeFolder(networkPath)).not.toThrow(new Error('some error'))
    expect(removeSync).toHaveBeenCalledWith(networkPath)
  })
})

test('returns the quorum wizard dot folder inside the user\'s home folder', () => {
  joinPath.mockImplementation((...segments) => join(...segments))
  expect(wizardHomeDir()).toEqual('/path/to/user/home/.quorum-wizard')
})
