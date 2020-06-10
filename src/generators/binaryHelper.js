import { wizardHomeDir } from '../utils/fileUtils'
import {
  isIstanbul,
  isTessera,
} from '../model/NetworkConfig'
import {
  BINARIES,
  createQuorumBinaryInfo,
  createCakeshopBinaryInfo,
  createTesseraBinaryInfo,
  downloadIfMissing,
  LATEST_BOOTNODE,
  LATEST_ISTANBUL_TOOLS,
} from './download'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

// This method could be improved, but right now it tries to:
// a. Cache downloads
// b. Only download if necessary for bash deployments
export async function downloadAndCopyBinaries(config) {
  info('Downloading dependencies...')
  const {
    transactionManager, cakeshop, generateKeys, quorumVersion, consensus,
  } = config.network

  const downloads = []

  if (isIstanbul(consensus)) {
    downloads.push(downloadIfMissing('istanbul', LATEST_ISTANBUL_TOOLS))
  }

  if (generateKeys) {
    downloads.push(downloadIfMissing('bootnode', LATEST_BOOTNODE))
  }

  if (quorumVersion !== 'PATH') {
    downloads.push(downloadIfMissing('quorum', quorumVersion))
  }
  const tesseraVersion = transactionManager
  if (tesseraVersion !== 'PATH' && isTessera(tesseraVersion)) {
    downloads.push(downloadIfMissing('tessera', tesseraVersion))
  }

  if (cakeshop !== 'none') {
    downloads.push(downloadIfMissing('cakeshop', cakeshop))
  }

  await Promise.all(downloads)
}

export function pathToQuorumBinary(quorumVersion) {
  if (quorumVersion === 'PATH') {
    return 'geth'
  }
  const binary = createQuorumBinaryInfo(quorumVersion)
  return joinPath(wizardHomeDir(), 'bin', 'quorum', quorumVersion, binary.name)
}

export function pathToTesseraJar(transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  }
  const binary = createTesseraBinaryInfo(transactionManager)
  return joinPath(wizardHomeDir(), 'bin', 'tessera', transactionManager, binary.name)
}

export function pathToCakeshop(version) {
  const binary = createCakeshopBinaryInfo(version)
  return joinPath(wizardHomeDir(), 'bin', 'cakeshop', version, binary.name)
}

export function pathToIstanbulTools() {
  const binary = BINARIES.istanbul[LATEST_ISTANBUL_TOOLS]
  return joinPath(wizardHomeDir(), 'bin', 'istanbul', LATEST_ISTANBUL_TOOLS, binary.name)
}

export function pathToBootnode() {
  const binary = BINARIES.bootnode[LATEST_BOOTNODE]
  return joinPath(wizardHomeDir(), 'bin', 'bootnode', LATEST_BOOTNODE, binary.name)
}
