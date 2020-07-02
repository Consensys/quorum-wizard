import { join, parse } from 'path'
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
    console.log(`Path (${path}) was outside working directory (${root})`)
    throw new Error('Path was outside of working directory')
  }
}

export function removeTrailingSlash(path) {
  return path.replace(/\/$/, '').replace(/\\$/, '')
}
