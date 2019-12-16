import fs from 'fs'
import path from 'path'

export function writeJsonFile (folder, filename, object, space = 2) {
  fs.writeFileSync(path.join(folder, filename),
    JSON.stringify(object, null, space))
}

export function writeFile (filePath, contents, executable = false) {
  fs.writeFileSync(filePath, contents)
  if (executable) {
    fs.chmodSync(filePath, '755')
  }
}

export function removeFolder (networkPath = '') {
  if (networkPath === '' ||
    networkPath === '/' ||
    networkPath.indexOf(process.cwd()) !== 0) {
    throw new Error('Tried to remove folder outside of working directory')
  }
  fs.rmdirSync(networkPath, { recursive: true })
}

export function createFolder (path, recursive = false) {
  fs.mkdirSync(path, { recursive })
}

export function copyFile (src, dest) {
  fs.copyFileSync(src, dest)
}

export function readFileToString (file) {
  return fs.readFileSync(file, 'utf8').trim()
}
