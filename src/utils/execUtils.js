import {
  exec,
  execSync,
} from 'child_process'

export function execute(command, callback) {
  exec(command, callback)
}

export function executeSync(command, options) {
  return execSync(command, options)
}

let JAVA_VERSION

export function runJavaVersionLookup() {
  const versionOutput = executeSync('java -version 2>&1 | grep -Eow \'[0-9]+\\.?[0-9]+?\' | head -1')
    .toString()
    .trim()

  if (versionOutput === '') {
    throw new Error('Could not read Java version number. Please make sure Java is installed on your machine.')
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
