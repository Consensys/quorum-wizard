import { execSync } from 'child_process'
import {
  isJava11Plus,
  runJavaVersionLookup,
} from './execUtils'

jest.mock('child_process')

describe('Gets java versions', () => {
  it('parses java 1.8 correctly', () => {
    execSync.mockReturnValueOnce('1.8')
    expect(runJavaVersionLookup()).toEqual(8)
  })
  it('parses java 11.x correctly', () => {
    execSync.mockReturnValueOnce('11.8')
    expect(runJavaVersionLookup()).toEqual(11)
  })
  it('parses java 13.x correctly', () => {
    execSync.mockReturnValueOnce('13.0')
    expect(runJavaVersionLookup()).toEqual(13)
  })
  it('parses java 14 (no decimal) correctly', () => {
    execSync.mockReturnValueOnce('14')
    expect(runJavaVersionLookup()).toEqual(14)
  })
  it('falls back to 11 on empty result', () => {
    execSync.mockReturnValueOnce('')
    expect(() => runJavaVersionLookup()).toThrow(new Error('Could not read Java version number. Please make sure Java is installed on your machine.'))
  })
  it('caches getJavaVersion', () => {
    execSync.mockReturnValueOnce('1.8')
    expect(isJava11Plus()).toEqual(false)
    execSync.mockReturnValueOnce('fail')
    expect(isJava11Plus()).toEqual(false)
  })
})
