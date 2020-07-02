import { exec, execSync } from 'child_process'
import isWsl from 'is-wsl'

export function executeSync(command, options) {
  return execSync(command, options)
}

export async function execute(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (e, stdout, stderr) => {
      if (e) {
        reject(e, stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

let JAVA_VERSION

export function runJavaVersionLookup() {
  const regexMatcher = /[0-9]+\.?[0-9]+?/
  const versionMatch = executeSync('java -version 2>&1')
    .toString()
    .trim()
    .match(regexMatcher)

  if (versionMatch === null) {
    throw new Error('Could not read Java version number. Please make sure Java is installed on your machine.')
  }

  const version = versionMatch[0]

  if (version === '1.8') {
    return 8
  }
  return parseInt(version, 10)
}

export function isJava11Plus() {
  if (!JAVA_VERSION) {
    JAVA_VERSION = runJavaVersionLookup()
  }
  return JAVA_VERSION >= 11
}

export function isWindows() {
  return isWin32() || isWindowsSubsystemLinux()
}

export function isWin32() {
  return process.platform === 'win32'
}

export function isWindowsSubsystemLinux() {
  return isWsl
}
