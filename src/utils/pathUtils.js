import { join, parse } from 'path'
import { isWin32 } from './execUtils'
import {
  generateAttachScript,
  generatePrivateContractExample,
  generatePublicContractExample,
  generateRunScript
} from '../generators/examplesHelper'

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

export const SCRIPTS = {
  start: {
    filename: addScriptExtension('start'),
    executable: true,
  },
  stop: {
    filename: addScriptExtension('stop'),
    executable: true,
  },
  attach: {
    filename: addScriptExtension('attach'),
    executable: true,
    generate: generateAttachScript,
  },
  runscript: {
    filename: addScriptExtension('runscript'),
    executable: true,
    generate: generateRunScript,
  },
  getEndpoints: {
    filename: addScriptExtension('getEndpoints'),
    executable: true,
  },
  publicContract: {
    filename: 'public_contract.js',
    executable: false,
    generate: generatePublicContractExample,
  },
  privateContract: {
    filename: 'private_contract.js',
    executable: false,
    generate: generatePrivateContractExample,
  },
}

function addScriptExtension(filename) {
  return `${filename}${isWin32() ? '.cmd' : '.sh'}`
}

export function wrapScript (script) {
  // `./start.sh` in shell, just `start.cmd` in windows
  return isWin32() ? script : `./${script}`
}