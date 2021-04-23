import { basename } from 'path'
import axios from 'axios'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { createWriteStream } from 'fs'
import {
  createFolder,
  exists,
  wizardHomeDir,
} from '../utils/fileUtils'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

// eslint-disable-next-line import/prefer-default-export
export async function downloadIfMissing(name, version) {
  if (BINARIES[name] === undefined || BINARIES[name][version] === undefined) {
    throw new Error(`Could not find binary info entry for ${name} ${version}`)
  }
  const binaryInfo = BINARIES[name][version]
  const binDir = joinPath(wizardHomeDir(), 'bin', name, version)
  const binaryFileLocation = joinPath(binDir, binaryInfo.name)
  if (!exists(binaryFileLocation)) {
    createFolder(binDir, true)
    const url = getPlatformSpecificUrl(binaryInfo)

    info(`Downloading ${name} ${version} from ${url}...`)
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    })

    info(`Unpacking to ${binaryFileLocation}`)
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
          info(`Saved to ${binaryFileLocation}`)
          resolve()
        })
        extractorStream.on('error', reject)
      })
    }
    const writer = createWriteStream(binaryFileLocation, { mode: 0o755 })
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        info(`Saved to ${binaryFileLocation}`)
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

export const LATEST_QUORUM = '21.4.0'
export const LATEST_TESSERA = '21.1.1'
export const LATEST_CAKESHOP = '0.12.1'
export const LATEST_ISTANBUL_TOOLS = '1.0.3'
export const LATEST_BOOTNODE = '1.9.7'
export const QUORUM_PRE_260 = '2.5.0'
export const LATEST_REPORTING = 'latest'

export const BINARIES = {
  quorum: {
    '21.4.0': {
      name: 'geth',
      description: 'Quorum 21.4.0',
      url: {
        darwin: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v21.4.0/geth_v21.4.0_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v21.4.0/geth_v21.4.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
    '21.1.0': {
      name: 'geth',
      description: 'Quorum 21.1.0',
      url: {
        darwin: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v21.1.0/geth_v21.1.0_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v21.1.0/geth_v21.1.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
    '20.10.0': {
      name: 'geth',
      description: 'Quorum 20.10.0',
      url: {
        darwin: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v20.10.0/geth_v20.10.0_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v20.10.0/geth_v20.10.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
    '2.7.0': {
      name: 'geth',
      description: 'Quorum 2.7.0',
      url: {
        darwin: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v2.7.0/geth_v2.7.0_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v2.7.0/geth_v2.7.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
    '2.6.0': {
      name: 'geth',
      description: 'Quorum 2.6.0',
      url: {
        darwin: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v2.6.0/geth_v2.6.0_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/go-quorum/raw/versions/v2.6.0/geth_v2.6.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
  },

  tessera: {
    '21.1.1': {
      name: 'tessera-app.jar',
      description: 'Tessera 21.1.1',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/net/consensys/quorum/tessera/tessera-app/21.1.1/tessera-app-21.1.1-app.jar',
      type: 'jar',
    },
    '21.1.0': {
      name: 'tessera-app.jar',
      description: 'Tessera 21.1.0',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/net/consensys/quorum/tessera/tessera-app/21.1.0/tessera-app-21.1.0-app.jar',
      type: 'jar',
    },
    '20.10.0': {
      name: 'tessera-app.jar',
      description: 'Tessera 20.10.0',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/net/consensys/quorum/tessera/tessera-app/20.10.0/tessera-app-20.10.0-app.jar',
      type: 'jar',
    },
    '0.11.0': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.11.0',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/net/consensys/quorum/tessera/tessera-app/0.11.0/tessera-app-0.11.0-app.jar',
      type: 'jar',
    },
    '0.10.6': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.6',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.6/tessera-app-0.10.6-app.jar',
      type: 'jar',
    },
    '0.10.5': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.5',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.5/tessera-app-0.10.5-app.jar',
      type: 'jar',
    },
    '0.10.4': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.4',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.4/tessera-app-0.10.4-app.jar',
      type: 'jar',
    },
  },

  cakeshop: {
    '0.12.1': {
      name: 'cakeshop.war',
      description: 'Cakeshop 0.12.1',
      url: 'https://github.com/jpmorganchase/cakeshop/releases/download/v0.12.1/cakeshop-0.12.1.war',
      type: 'jar',
    },
  },

  istanbul: {
    '1.0.3': {
      name: 'istanbul',
      url: {
        darwin: 'https://artifacts.consensys.net/public/quorum-tools/raw/versions/v1.0.3/istanbul-tools_v1.0.3_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/quorum-tools/raw/versions/v1.0.3/istanbul-tools_v1.0.3_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'istanbul',
      ],
    },
  },

  bootnode: {
    '1.9.7': {
      name: 'bootnode',
      url: {
        darwin: 'https://artifacts.consensys.net/public/quorum-tools/raw/versions/v1.9.7/bootnode_v1.9.7_darwin_amd64.tar.gz',
        linux: 'https://artifacts.consensys.net/public/quorum-tools/raw/versions/v1.9.7/bootnode_v1.9.7_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'bootnode',
      ],
    },
  },
}
