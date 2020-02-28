import {
  exec,
  execSync,
} from 'child_process'
import { error } from './log'

export function execute(command, callback) {
  exec(command, callback)
}

export function executeSync(command, options) {
  return execSync(command, options)
}

let JAVA_VERSION

export function runJavaVersionLookup() {
  let versionOutput = '13'
  try {
    versionOutput = executeSync('java -version 2>&1 | grep -Eow \'[0-9]+\\.[0-9]+\' | head -1')
      .toString()
      .trim()
  } catch (e) {
    error(`Could not get Java version, defaulting to Java ${versionOutput}`, e)
  }

  if (versionOutput === '1.8') {
    return 8
  }
  return parseInt(versionOutput, 10)
}

export function isJava11Plus() {
  if (!JAVA_VERSION) {
    JAVA_VERSION = runJavaVersionLookup()
  }
  return JAVA_VERSION >= 11
}
