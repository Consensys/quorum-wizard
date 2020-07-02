import { join, normalize } from 'path'
import { joinPath, removeTrailingSlash, verifyPathInsideDirectory } from './pathUtils'
import { cwd } from './fileUtils'

describe('joins paths safely', () => {
  it('joins regular paths', () => {
    expect(joinPath(normalize('/home/test'), 'path', 'to', 'something')).toEqual(normalize('/home/test/path/to/something'))
  })
  it('joins relative paths inside root', () => {
    expect(joinPath(normalize('/home/test'), 'path', 'to', 'something', '../somethingelse')).toEqual(normalize('/home/test/path/to/somethingelse'))
  })
  it('does not join paths outside of root directory', () => {
    expect(() => joinPath(normalize('/home/test'), '../path', 'to', 'something')).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not join paths that are equal to the root directory', () => {
    expect(() => joinPath(normalize('/home/test'), '.')).toThrow(new Error('Path was outside of working directory'))
  })
  it('does not join paths that are equal to the root directory with a trailing slash', () => {
    expect(() => joinPath(normalize('/home/test'), '/./')).toThrow(new Error('Path was outside of working directory'))
  })
})

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
  expect(removeTrailingSlash(normalize('/home/test/'))).toEqual(normalize('/home/test'))
  expect(removeTrailingSlash(normalize('/home/test'))).toEqual(normalize('/home/test'))
})
