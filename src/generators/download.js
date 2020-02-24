import {
  basename,
  join,
} from 'path'
import axios from 'axios'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { createWriteStream } from 'fs'
import {
  createFolder,
  exists,
  libRootDir,
} from '../utils/fileUtils'
import { info } from '../utils/log'

// eslint-disable-next-line import/prefer-default-export
export async function downloadIfMissing(name, version) {
  if (BINARIES[name] === undefined || BINARIES[name][version] === undefined) {
    throw new Error(`Could not find binary info entry for ${name} ${version}`)
  }
  const binaryInfo = BINARIES[name][version]
  const binDir = join(libRootDir(), 'bin', name, version)
  const binaryFileLocation = join(binDir, binaryInfo.name)
  if (!exists(binaryFileLocation)) {
    createFolder(binDir, true)
    const url = getPlatformSpecificUrl(binaryInfo)

    info(`Downloading ${name} ${version} from ${url}...`)
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    })

    info(`Saving to ${binaryFileLocation}`)
    if (binaryInfo.type === 'tar.gz') {
      const extractorStream = response.data.pipe(createGunzip())
        .pipe(extract(binDir, {
          map: (header) => {
            const filename = basename(header.name)
            if (binaryInfo.files.includes(filename)) {
              // don't include folders when extracting files we want
              header.name = filename // eslint-disable-line no-param-reassign
            }
            return header
          },
          ignore: (pathName) => !binaryInfo.files.includes(basename(pathName)),
        }))
      return new Promise((resolve, reject) => {
        extractorStream.on('finish', () => {
          info('Done')
          resolve()
        })
        extractorStream.on('error', reject)
      })
    }
    const writer = createWriteStream(binaryFileLocation, { mode: 0o755 })
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        info('Done')
        resolve()
      })
      writer.on('error', reject)
    })
  }
  info(`Using cached ${name} at: ${binaryFileLocation}`)
  return binaryFileLocation
}

export function getPlatformSpecificUrl({ url }) {
  if (typeof url === 'string') {
    return url
  }
  const platformUrl = url[process.platform]
  if (platformUrl === undefined) {
    throw new Error(
      `Sorry, your platform (${process.platform}) is not supported.`,
    )
  }
  return platformUrl
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
    },
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
    },
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
    },
  },
}
