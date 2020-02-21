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

// This method could be improved, but right now it tries to:
// a. Cache downloads
// b. Only download if necessary for keygen or istanbul
// c. Don't download if using docker (except stuff for keygen/istanbul)
export async function downloadAndCopyBinaries(config) {
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

    if (!docker && cakeshop) {
      await downloadIfMissing('cakeshop', '0.11.0-RC2')
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
  return Object.entries(versions).map((entry) => {
    const key = entry[0]
    const { description } = entry[1]
    return {
      name: description,
      value: key,
    }
  })
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
  const info = BINARIES.quorum[quorumVersion]
  return join(libRootDir(), 'bin', 'quorum', quorumVersion, info.name)
}

export function pathToTesseraJar(transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  }
  const info = BINARIES.tessera[transactionManager]
  return join(libRootDir(), 'bin', 'tessera', transactionManager, info.name)
}

export function pathToCakeshop() {
  const info = BINARIES.cakeshop['0.11.0-RC2']
  return join(libRootDir(), 'bin', 'cakeshop', '0.11.0-RC2', info.name)
}

export function pathToIstanbulTools() {
  const info = BINARIES.istanbul['1.0.1']
  return join(libRootDir(), 'bin', 'istanbul', '1.0.1', info.name)
}

export function pathToBootnode() {
  const info = BINARIES.bootnode['1.8.27']
  return join(libRootDir(), 'bin', 'bootnode', '1.8.27', info.name)
}
