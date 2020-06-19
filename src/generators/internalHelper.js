import {
  readJsonFile,
  libRootDir,
  exists,
} from '../utils/fileUtils'
import { joinPath } from '../utils/pathUtils'

export function isInternal() {
  return exists(joinPath(libRootDir(), 'internal', 'internal-config.json'))
}

export function approvedVersions(name) {
  const internalConfig = readJsonFile(joinPath(libRootDir(), 'internal', 'internal-config.json'))
  let versions
  switch (name) {
    case 'quorum':
      versions = internalConfig.approvedQuorum
      break
    case 'tessera':
      versions = internalConfig.approvedTessera
      break
    case 'cakeshop':
      versions = internalConfig.approvedCakeshop
      break
    default:
      versions = []
  }
  return versions
}

export function dockerRegistry() {
  const internalConfig = readJsonFile(joinPath(libRootDir(), 'internal', 'internal-config.json'))
  return internalConfig.dockerRegistry
}
