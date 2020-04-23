import { wizardHomeDir } from '../utils/fileUtils'
import { executeSync } from '../utils/execUtils'
import {
  isBash,
  isIstanbul,
  isTessera,
  isKubernetes,
} from '../model/NetworkConfig'
import {
  BINARIES,
  downloadIfMissing,
} from './download'
import { disableIfWrongJavaVersion } from '../questions/validators'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

// This method could be improved, but right now it tries to:
// a. Cache downloads
// b. Only download if necessary for keygen or istanbul
// c. Don't download if using docker (except stuff for keygen/istanbul)
export async function downloadAndCopyBinaries(config) {
  info('Downloading dependencies...')
  const {
    transactionManager, cakeshop, deployment, generateKeys, quorumVersion, consensus,
  } = config.network
  const bash = isBash(deployment)
  const kubernetes = isKubernetes(deployment)

  // needed no matter what if using istanbul to generate genesis
  if (isIstanbul(consensus) && !kubernetes) {
    await downloadIfMissing('istanbul', '1.0.1')
  }

  if (bash) {
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

    if (cakeshop !== 'none') {
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

export function getDownloadableGethChoices(deployment) {
  let choices = getDownloadableChoices(BINARIES.quorum)
  if (isBash(deployment)) {
    choices = choices.concat(getGethOnPath())
  }
  return choices
}

export function getDownloadableTesseraChoices(deployment) {
  let choices = getDownloadableChoices(BINARIES.tessera)
  if (isBash(deployment)) {
    choices = choices.concat(getTesseraOnPath())
  } else {
    // allow all options in docker compose mode since local jdk version doesn't matter
    choices = choices.map((choice) => ({ ...choice, disabled: false }))
  }
  return isKubernetes(deployment) ? choices : choices.concat('none')
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
  return joinPath(wizardHomeDir(), 'bin', 'quorum', quorumVersion, binary.name)
}

export function pathToTesseraJar(transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  }
  const binary = BINARIES.tessera[transactionManager]
  return joinPath(wizardHomeDir(), 'bin', 'tessera', transactionManager, binary.name)
}

export function pathToCakeshop(version) {
  const binary = BINARIES.cakeshop[version]
  return joinPath(wizardHomeDir(), 'bin', 'cakeshop', version, binary.name)
}

export function pathToIstanbulTools() {
  const binary = BINARIES.istanbul['1.0.1']
  return joinPath(wizardHomeDir(), 'bin', 'istanbul', '1.0.1', binary.name)
}

export function pathToBootnode() {
  const binary = BINARIES.bootnode['1.8.27']
  return joinPath(wizardHomeDir(), 'bin', 'bootnode', '1.8.27', binary.name)
}
