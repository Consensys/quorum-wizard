import { getOutputPath, libRootDir } from './fileUtils'
import { normalize } from 'path'
import { joinPath } from './pathUtils'

export const TEST_CWD = '/current/working/dir'
export const TEST_LIB_ROOT_DIR = '/npm/global/module/dir'
export const TEST_WIZARD_HOME_DIR = '/path/to/user/home/.quorum-wizard'

export function overrideProcessValue(key, value) {
  // process.platform is read-only, use this workaround to set it
  Object.defineProperty(process, key, { value })
}

export function createNetPath(config, ...relativePaths) {
  return joinPath(normalize(getOutputPath()), 'network', config.network.name, ...relativePaths)
}

export function createLibPath(...relativePaths) {
  return joinPath(normalize(libRootDir()), ...relativePaths)
}

export function createConfigPath(...relativePaths) {
  return joinPath(normalize(getOutputPath()), 'configs', ...relativePaths)
}
