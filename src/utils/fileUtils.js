import fs from 'fs-extra'
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
  return fs.existsSync(path)
}

export function writeJsonFile(folder, filename, object, space = 2) {
  fs.writeFileSync(join(folder, filename), JSON.stringify(object, null, space))
}

export function writeFile(filePath, contents, executable = false) {
  fs.writeFileSync(filePath, contents)
  if (executable) {
    fs.chmodSync(filePath, '755')
  }
}

export function removeFolder(networkPath = '') {
  if (networkPath === ''
    || networkPath === '/'
    || networkPath.indexOf(cwd()) !== 0) {
    throw new Error('Tried to remove folder outside of working directory')
  }

  if (exists(networkPath)) {
    fs.removeSync(networkPath)
  }
}

export function createFolder(path, recursive = false) {
  fs.mkdirSync(path, { recursive })
}

export function copyFile(src, dest) {
  fs.copyFileSync(src, dest)
}

export function readFileToString(file) {
  return fs.readFileSync(file, 'utf8').trim()
}

export function formatNewLine(file) {
  return file !== '' ? `${file}\n` : file
}
