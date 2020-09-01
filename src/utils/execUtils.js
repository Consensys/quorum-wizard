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
  let versionText
  try {
    versionText = executeSync('java -version 2>&1')
      .toString()
      .trim()
  } catch (e) {
    // java probably doesn't exist
    return 0
  }
  const versionMatch = versionText
    .match(/[0-9]+\.?[0-9]+?/)

  if (versionMatch === null) {
    // java exists but output is unrecognized
    throw new Error(`Could not read Java version number in output: ${versionText}`)
  }

  const version = versionMatch[0]

  if (version === '1.8') {
    return 8
  }
  return parseInt(version, 10)
}

export function getJavaVersion() {
  if (!JAVA_VERSION) {
    JAVA_VERSION = runJavaVersionLookup()
  }
  return JAVA_VERSION
}

export function isJava11Plus() {
  return getJavaVersion() >= 11
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
