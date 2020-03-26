import { join } from 'path'
import { removeTrailingSlash, verifyPathInsideDirectory } from './pathUtils'
import { cwd } from './fileUtils'

describe('verifies that path is inside of specified root folder', () => {
  it('does not allow empty folder', () => {
    expect(() => verifyPathInsideDirectory(cwd(), '')).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not allow root path', () => {
    expect(() => verifyPathInsideDirectory(cwd(), '/')).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not allow path outside cwd', () => {
    const oneFolderUp = join(cwd(), '..')
    expect(() => verifyPathInsideDirectory(cwd(), oneFolderUp)).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not allow path that is exactly cwd', () => {
    const path = join(cwd(), '')
    expect(() => verifyPathInsideDirectory(cwd(), path)).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not allow path that is exactly cwd with a trailing slash', () => {
    const path = join(cwd(), '/')
    expect(() => verifyPathInsideDirectory(cwd(), path)).toThrow(new Error('Path was outside of working directory'))
  })
  it('allows path inside cwd', () => {
    const path = join(cwd(), 'test')
    expect(() => verifyPathInsideDirectory(cwd(), path)).not.toThrow(new Error('Path was outside of working directory'))
  })
})

it('removes trailing slash from path strings', () => {
  expect(removeTrailingSlash('/home/test/')).toEqual('/home/test')
  expect(removeTrailingSlash('/home/test')).toEqual('/home/test')
})
