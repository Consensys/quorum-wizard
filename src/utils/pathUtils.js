import { join, parse, posix } from 'path'
import { isWin32 } from './execUtils'

// C:\\ on windows, for example
const ROOT = isWin32() ? parse(process.cwd()).root : '/'

export function joinPath(root, ...segments) {
  const path = join(root, ...segments)
  verifyPathInsideDirectory(root, path)
  return path
}

export function verifyPathInsideDirectory(root, path) {
  if (path === ''
  || path === ROOT
  || removeTrailingSlash(root) === removeTrailingSlash(path)
  || path.indexOf(root) !== 0) {
    throw new Error('Path was outside of working directory')
  }
}

export function removeTrailingSlash(path) {
  return path.replace(/\/$/, '').replace(/\\$/, '')
}

export function wrapScript(script) {
  // `./start.sh` in shell, just `start.cmd` in windows
  return isWin32() ? script : `./${script}`
}

// convert C:\folder\ to /c/folder/ for docker on windows
export function unixifyPath(path) {
  if (!isWin32()) {
    return path
  }
  const unixifiedPath = path.replace(/\\/g, '/')
  const matcher = unixifiedPath.match(/^(\w):(.*)$/)
  if (matcher) {
    return posix.join('/', matcher[1].toLowerCase(), matcher[2])
  }
  return unixifiedPath
}
