import { join } from 'path'

export function joinPath(root, ...segments) {
  const path = join(root, ...segments)
  verifyPathInsideDirectory(root, path)
  return path
}

export function verifyPathInsideDirectory(root, path) {
  if (path === ''
  || path === '/'
  || removeTrailingSlash(root) === removeTrailingSlash(path)
  || path.indexOf(root) !== 0) {
    throw new Error('Path was outside of working directory')
  }
}

export function removeTrailingSlash(path) {
  return path.replace(/\/$/, '')
}
