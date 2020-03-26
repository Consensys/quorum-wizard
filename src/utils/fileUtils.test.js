import { existsSync, removeSync } from 'fs-extra'
import { removeFolder } from './fileUtils'
import { verifyPathInsideDirectory } from './pathUtils'

jest.mock('fs-extra')
jest.mock('./pathUtils')
existsSync.mockReturnValue(true)

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
