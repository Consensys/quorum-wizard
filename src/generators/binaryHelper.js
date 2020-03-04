import { join } from 'path'
import { libRootDir } from '../utils/fileUtils'
import { executeSync } from '../utils/execUtils'
import {
  isDocker,
  isIstanbul,
  isTessera,
} from '../model/NetworkConfig'
import {
  BINARIES,
  downloadIfMissing,
} from './download'
import { disableIfWrongJavaVersion } from '../questions/validators'
import { info } from '../utils/log'

// This method could be improved, but right now it tries to:
// a. Cache downloads
// b. Only download if necessary for keygen or istanbul
// c. Don't download if using docker (except stuff for keygen/istanbul)
export async function downloadAndCopyBinaries(config) {
  info('Downloading dependencies...')
  const {
    transactionManager, cakeshop, deployment, generateKeys, quorumVersion, consensus,
  } = config.network
  const docker = isDocker(deployment)
  const isDockerButNeedsBinaries = docker && generateKeys

  // needed no matter what if using istanbul to generate genesis
  if (isIstanbul(consensus)) {
    await downloadIfMissing('istanbul', '1.0.1')
  }

  if (!docker || isDockerButNeedsBinaries) {
    if (generateKeys) {
      await downloadIfMissing('bootnode', '1.8.27')
    }

    if (quorumVersion !== 'PATH') {
      await downloadIfMissing('quorum', quorumVersion)
    }
    const tesseraVersion = transactionManager
    if (tesseraVersion !== 'PATH' && isTessera(tesseraVersion)) {
      await downloadIfMissing('tessera', tesseraVersion)
    }

    if (!docker && cakeshop !== 'none') {
      await downloadIfMissing('cakeshop', cakeshop)
    }
  }
}

export function getGethOnPath() {
  const pathChoices = []
  try {
    const gethOnPath = executeSync('which geth').toString().trim()
    if (gethOnPath) {
      const gethVersionOutput = executeSync('geth version').toString()
      const versionMatch = gethVersionOutput.match(/Quorum Version: (\S+)/)
      if (versionMatch !== null) {
        const version = versionMatch[1]
        pathChoices.push({
          name: `Quorum ${version} on path (${gethOnPath})`,
          value: 'PATH',
        })
      }
    }
  } catch (e) {
    // either no geth or the version call errored, don't include it in choices
  }
  return pathChoices
}

export function getDownloadableGethChoices() {
  return getDownloadableChoices(BINARIES.quorum)
}

export function getDownloadableTesseraChoices() {
  return getDownloadableChoices(BINARIES.tessera)
}

function getDownloadableChoices(versions) {
  return Object.entries(versions).map(([key, binaryInfo]) => ({
    name: binaryInfo.description,
    value: key,
    disabled: disableIfWrongJavaVersion(binaryInfo),
  }))
}

export function getTesseraOnPath() {
  const pathChoices = []
  const tesseraJarEnv = process.env.TESSERA_JAR
  if (tesseraJarEnv) {
    pathChoices.push({
      name: `Tessera at $TESSERA_JAR (${tesseraJarEnv})`,
      value: 'PATH',
    })
  }
  return pathChoices
}

export function pathToQuorumBinary(quorumVersion) {
  if (quorumVersion === 'PATH') {
    return 'geth'
  }
  const binary = BINARIES.quorum[quorumVersion]
  return join(libRootDir(), 'bin', 'quorum', quorumVersion, binary.name)
}

export function pathToTesseraJar(transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  }
  const binary = BINARIES.tessera[transactionManager]
  return join(libRootDir(), 'bin', 'tessera', transactionManager, binary.name)
}

export function pathToCakeshop(version) {
  const binary = BINARIES.cakeshop[version]
  return join(libRootDir(), 'bin', 'cakeshop', version, binary.name)
}

export function pathToIstanbulTools() {
  const binary = BINARIES.istanbul['1.0.1']
  return join(libRootDir(), 'bin', 'istanbul', '1.0.1', binary.name)
}

export function pathToBootnode() {
  const binary = BINARIES.bootnode['1.8.27']
  return join(libRootDir(), 'bin', 'bootnode', '1.8.27', binary.name)
}
