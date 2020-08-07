import { execSync } from 'child_process'
import {
  isJava11Plus,
  runJavaVersionLookup,
} from './execUtils'

jest.mock('child_process')

const OpenJDK14 = `openjdk version "14.0.1" 2020-04-14
OpenJDK Runtime Environment (build 14.0.1+14)
OpenJDK 64-Bit Server VM (build 14.0.1+14, mixed mode, sharing)
`
const OpenJDK11 = `openjdk version "11.0.7" 2020-04-14
OpenJDK Runtime Environment (build 11.0.7+10)
OpenJDK 64-Bit Server VM (build 11.0.7+10, mixed mode)
`

const OpenJDK8 = `openjdk version "1.8.0_262"
OpenJDK Runtime Environment (AdoptOpenJDK)(build 1.8.0_262-b10)
OpenJDK 64-Bit Server VM (AdoptOpenJDK)(build 25.262-b10, mixed mode)
`

const OracleJDK8 = `java version "1.8.0_262"
Java(TM) SE Runtime Environment (build 1.8.0_262-b15)
Java HotSpot(TM) 64-Bit Server VM (build 25.262-b10, mixed mode)
`

describe('Gets java versions', () => {
  it('parses java 1.8 correctly', () => {
    execSync.mockReturnValueOnce(OracleJDK8)
    expect(runJavaVersionLookup()).toEqual(8)
  })
  it('parses openjdk 1.8 correctly', () => {
    execSync.mockReturnValueOnce(OpenJDK8)
    expect(runJavaVersionLookup()).toEqual(8)
  })
  it('parses java 11.x correctly', () => {
    execSync.mockReturnValueOnce(OpenJDK11)
    expect(runJavaVersionLookup()).toEqual(11)
  })
  it('parses java 14 (no decimal) correctly', () => {
    execSync.mockReturnValueOnce(OpenJDK14)
    expect(runJavaVersionLookup()).toEqual(14)
  })
  it('sets java version to 0 when java -version throws an exception', () => {
    execSync.mockImplementation(() => {
      throw new Error('bash: ava: command not found')
    });
    expect(runJavaVersionLookup()).toEqual(0)
  })
  it('throws error on unrecognized version text', () => {
    execSync.mockReturnValueOnce('fail')
    expect(() => runJavaVersionLookup()).toThrow(new Error('Could not read Java version number in output: fail'))
  })
  it('caches getJavaVersion', () => {
    execSync.mockReturnValueOnce('1.8')
    expect(isJava11Plus()).toEqual(false)
    execSync.mockReturnValueOnce('fail')
    expect(isJava11Plus()).toEqual(false)
  })
})
