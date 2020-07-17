import { pathToCakeshop, pathToQuorumBinary, pathToTesseraJar } from '../binaryHelper'
import { isCakeshop, isTessera } from '../../model/NetworkConfig'
import { isWin32 } from '../../utils/execUtils'
import { wrapScript } from '../../utils/pathUtils'
import SCRIPTS from './index'

export function setEnvironmentCommand (config) {
  const lines = []
  lines.push(`BIN_GETH=${pathToQuorumBinary(config.network.quorumVersion)}`)
  if (isTessera(config.network.transactionManager)) {
    lines.push(`BIN_TESSERA=${pathToTesseraJar(config.network.transactionManager)}`)
  }
  if (isCakeshop(config.network.cakeshop)) {
    lines.push(`BIN_CAKESHOP=${pathToCakeshop(config.network.cakeshop)}`)
  }
  lines.push('')
  return lines.join('\n')
}

export function addScriptExtension(filename) {
  return `${filename}${isWin32() ? '.cmd' : '.sh'}`
}

export function scriptHeader () {
  return isWin32() ? scriptHeaderWindows() : scriptHeaderBash()
}
function scriptHeaderWindows () {
  return '@ECHO OFF\nSETLOCAL'
}

function scriptHeaderBash () {
  return '#!/bin/bash'
}

export function validateNodeNumberInput (config) {
  return isWin32() ? validateEnvNodeNumberWindows(config) : validateEnvNodeNumberBash(config)
}

function validateEnvNodeNumberWindows (config) {
  return `SET NUMBER_OF_NODES=${config.nodes.length}
SET /A NODE_NUMBER=%1

if "%1"=="" (
    echo Please provide the number of the node to attach to (i.e. attach.cmd 2) && EXIT /B 1
)

if %NODE_NUMBER% EQU 0 (
    echo Please provide the number of the node to attach to (i.e. attach.cmd 2) && EXIT /B 1
)

if %NODE_NUMBER% GEQ %NUMBER_OF_NODES%+1 (
    echo %1 is not a valid node number. Must be between 1 and %NUMBER_OF_NODES%. && EXIT /B 1
)`
}

function validateEnvNodeNumberBash (config) {
  return `NUMBER_OF_NODES=${config.nodes.length}
NODE_NUMBER=$1
case "$NODE_NUMBER" in ("" | *[!0-9]*)
  echo 'Please provide the number of the node to attach to (i.e. ./attach.sh 2)' >&2
  exit 1
esac

if [ "$NODE_NUMBER" -lt 1 ] || [ "$NODE_NUMBER" -gt $NUMBER_OF_NODES ]; then
  echo "$NODE_NUMBER is not a valid node number. Must be between 1 and $NUMBER_OF_NODES." >&2
  exit 1
fi`
}

export function filenameCheck () {
  return isWin32() ? filenameCheckWindows() : filenameCheckBash()
}

function filenameCheckWindows () {
  // TODO this should allow for any existing file
  return `if NOT "%1"=="${SCRIPTS.privateContract.filename}" if NOT "%1"=="${SCRIPTS.publicContract.filename}" (
  echo Please provide a valid script file to execute (i.e. ${wrapScript(SCRIPTS.runscript.filename)} ${SCRIPTS.privateContract.filename}) && EXIT /B 1
)`
}

function filenameCheckBash () {
  return `if [ -z $1 ] || [ ! -f $1 ]; then
  echo "Please provide a valid script file to execute (i.e. ${wrapScript(SCRIPTS.runscript.filename)} ${SCRIPTS.privateContract.filename})" >&2
  exit 1
fi`
}