import {
  existsSync,
  writeFileSync,
  chmodSync,
  removeSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
} from 'fs-extra'
import {
  join,
  resolve,
} from 'path'

// this file is in $ROOT/build/utils/ and the bin, lib, and 7nodes folders are in $ROOT.
// Go up two folders and cache that path for later use
const libRoot = resolve(__dirname, '../..')

export function cwd() {
  return process.cwd()
}

export function libRootDir() {
  return libRoot
}

export function exists(path) {
  return existsSync(path)
}

export function writeJsonFile(folder, filename, object, space = 2) {
  writeFileSync(join(folder, filename), JSON.stringify(object, null, space))
}

export function writeFile(filePath, contents, executable = false) {
  writeFileSync(filePath, contents)
  if (executable) {
    chmodSync(filePath, '755')
  }
}

export function removeFolder(networkPath = '') {
  if (networkPath === ''
    || networkPath === '/'
    || networkPath.indexOf(cwd()) !== 0) {
    throw new Error('Tried to remove folder outside of working directory')
  }

  if (exists(networkPath)) {
    removeSync(networkPath)
  }
}

export function createFolder(path, recursive = false) {
  mkdirSync(path, { recursive })
}

export function copyFile(src, dest) {
  copyFileSync(src, dest)
}

export function readFileToString(file) {
  return readFileSync(file, 'utf8').trim()
}

export function formatNewLine(file) {
  return file !== '' ? `${file}\n` : file
}
