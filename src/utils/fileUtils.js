import { homedir } from 'os'
import {
  chmodSync,
  copyFileSync,
  copySync,
  readdirSync,
  existsSync,
  mkdirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} from 'fs-extra'
import { resolve } from 'path'
import { joinPath, verifyPathInsideDirectory } from './pathUtils'

// this file is in $ROOT/build/utils/ and the bin, lib, and 7nodes folders are in $ROOT.
// Go up two folders and cache that path for later use
const libRoot = resolve(__dirname, '../..')

let outputPath

export function setOutputPath(path) {
  outputPath = path
}

export function getOutputPath() {
  return (outputPath !== undefined) ? outputPath : cwd()
}

export function cwd() {
  return process.cwd()
}

export function libRootDir() {
  return libRoot
}

export function wizardHomeDir() {
  return joinPath(homedir(), '.quorum-wizard')
}

export function exists(path) {
  return existsSync(path)
}

export function writeJsonFile(folder, filename, object, space = 2) {
  writeFileSync(joinPath(folder, filename), JSON.stringify(object, null, space))
}

export function readJsonFile(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function writeFile(filePath, contents, executable = false) {
  writeFileSync(filePath, contents)
  if (executable) {
    chmodSync(filePath, '755')
  }
}

export function writeScript(networkPath, config, script) {
  writeFile(
    joinPath(networkPath, script.filename),
    script.generate(config),
    script.executable,
  )
}

export function removeFolder(networkPath = '') {
  verifyPathInsideDirectory(getOutputPath(), networkPath)

  if (exists(networkPath)) {
    removeSync(networkPath)
  }
}

export function createFolder(path, recursive = false) {
  mkdirSync(path, { recursive })
}

export function copyScript(src, dest) {
  copyFile(src, dest)
  chmodSync(dest, '755')
}

export function copyFile(src, dest) {
  copyFileSync(src, dest)
}

export function copyDirectory(src, dest) {
  copySync(src, dest)
}

export function readFileToString(file) {
  return readFileSync(file, 'utf8').trim()
}

export function formatNewLine(file) {
  return file !== '' ? `${file}\n` : file
}

export function readDir(dir) {
  return exists(dir) ? readdirSync(dir) : undefined
}
