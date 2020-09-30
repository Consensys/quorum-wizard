import sanitize from 'sanitize-filename'
import { cwd } from '../utils/fileUtils'
import { joinPath } from '../utils/pathUtils'

// eslint-disable-next-line import/prefer-default-export
export function getFullNetworkPath(config) {
  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  return joinPath(config.network.networkPath, 'network', networkFolderName)
}
