import { libRootDir } from '../utils/fileUtils'
import { join } from 'path'
import { executeSync } from '../utils/execUtils'
import { isDocker, isIstanbul } from '../model/NetworkConfig'
import { downloadIfMissing } from './download'

export function getPlatformSpecificUrl ({ url }) {
  if (typeof url === 'string') {
    return url
  }
  const platformUrl = url[process.platform]
  if (platformUrl === undefined) {
    throw new Error(
      `Sorry, your platform (${process.platform}) is not supported.`)
  }
  return platformUrl
}

// This method could be improved, but right now it tries to:
// a. Cache downloads
// b. Only download if necessary for keygen or istanbul
// c. Don't download if using docker (except stuff for keygen/istanbul)
export async function downloadAndCopyBinaries (config) {
  const { transactionManager, cakeshop, deployment, generateKeys, quorumVersion, consensus } = config.network
  const docker = isDocker(deployment)
  const isDockerButNeedsBinaries = docker && generateKeys

  // needed no matter what if using istanbul to generate genesis
  if (isIstanbul(consensus)) {
    await downloadIfMissing('istanbul', '1.0.1')
  }

  if(!docker || isDockerButNeedsBinaries) {
    if (generateKeys) {
      await downloadIfMissing('bootnode', '1.8.27')
    }

    if (quorumVersion !== 'PATH') {
      await downloadIfMissing('quorum', quorumVersion)
    }
    let tesseraVersion = transactionManager
    if (tesseraVersion !== 'PATH' && tesseraVersion !== 'none') {
      await downloadIfMissing('tessera', tesseraVersion)
    }

    if (!docker && cakeshop) {
      await downloadIfMissing('cakeshop', '0.11.0-RC2')
    }
  }
  console.log('')
}

export function getGethOnPath () {
  let pathChoices = []
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

export function getDownloadableGethChoices () {
  return getDownloadableChoices(BINARIES.quorum)
}

export function getDownloadableTesseraChoices () {
  return getDownloadableChoices(BINARIES.tessera)
}

function getDownloadableChoices (versions) {
  return Object.entries(versions).map((entry) => {
    const key = entry[0]
    const { description } = entry[1]
    return {
      name: description,
      value: key,
    }
  })
}

export function getTesseraOnPath () {
  let pathChoices = []
  const tesseraJarEnv = process.env.TESSERA_JAR
  if (tesseraJarEnv) {
    pathChoices.push({
      name: `Tessera at $TESSERA_JAR (${tesseraJarEnv})`,
      value: 'PATH',
    })
  }
  return pathChoices
}

export function pathToQuorumBinary (quorumVersion) {
  if (quorumVersion === 'PATH') {
    return 'geth'
  } else {
    const info = BINARIES.quorum[quorumVersion]
    return join(libRootDir(), 'bin', 'quorum', quorumVersion, info.name)
  }
}

export function pathToTesseraJar (transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  } else {
    const info = BINARIES.tessera[transactionManager]
    return join(libRootDir(), 'bin', 'tessera', transactionManager, info.name)
  }
}

export function pathToCakeshop () {
  const info = BINARIES.cakeshop['0.11.0-RC2']
  return join(libRootDir(), 'bin', 'cakeshop', '0.11.0-RC2', info.name)
}

export function pathToIstanbulTools () {
  const info = BINARIES.istanbul['1.0.1']
  return join(libRootDir(), 'bin', 'istanbul', '1.0.1', info.name)
}

export function pathToBootnode () {
  const info = BINARIES.bootnode['1.8.27']
  return join(libRootDir(), 'bin', 'bootnode', '1.8.27', info.name)
}


export const BINARIES = {
  quorum: {
    '2.4.0': {
      name: 'geth',
      description: 'Quorum 2.4.0',
      url: {
        darwin: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.4.0/geth_v2.4.0_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.4.0/geth_v2.4.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
  },

  tessera: {
    '0.10.3': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.3 (Java 11+)',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.3/tessera-app-0.10.3-app.jar',
      type: 'jar',
    },
    '0.10.2': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.2 (Java 8)',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.2/tessera-app-0.10.2-app.jar',
      type: 'jar',
    },
  },

  cakeshop: {
    '0.11.0-RC2': {
      name: 'cakeshop.war',
      url: 'https://github.com/jpmorganchase/cakeshop/releases/download/v0.11.0-RC2/cakeshop-0.11.0-RC2.war',
      type: 'war',
    }
  },

  istanbul: {
    '1.0.1': {
      name: 'istanbul',
      url: {
        darwin: 'https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_v1.0.1_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_v1.0.1_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'istanbul',
      ],
    }
  },

  bootnode: {
    '1.8.27': {
      name: 'bootnode',
      url: {
        darwin: 'https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_v1.8.27_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_v1.8.27_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'bootnode',
      ],
    }
  }
}
