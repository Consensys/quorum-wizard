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

export const LATEST_QUORUM = '2.6.0'
export const LATEST_TESSERA = '0.10.5'
export const LATEST_TESSERA_J8 = '0.10.2'
export const LATEST_CAKESHOP = '0.11.0'
export const LATEST_CAKESHOP_J8 = '0.11.0-J8'
export const LATEST_ISTANBUL_TOOLS = '1.0.3'
export const LATEST_BOOTNODE = '1.9.7'
export const QUORUM_PRE_260 = '2.5.0'

export const BINARIES = {
  quorum: {
    '2.6.0': {
      name: 'geth',
      description: 'Quorum 2.6.0',
      url: {
        darwin: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.6.0/geth_v2.6.0_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.6.0/geth_v2.6.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
    '2.5.0': {
      name: 'geth',
      description: 'Quorum 2.5.0',
      url: {
        darwin: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.5.0/geth_v2.5.0_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.5.0/geth_v2.5.0_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'geth',
      ],
    },
  },

  tessera: {
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
    '0.10.2': {
      name: 'tessera-app.jar',
      description: 'Tessera 0.10.2',
      url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.2/tessera-app-0.10.2-app.jar',
      type: 'jar8',
    },
  },

  cakeshop: {
    '0.11.0': {
      name: 'cakeshop.war',
      description: 'Cakeshop 0.11.0',
      url: 'https://github.com/jpmorganchase/cakeshop/releases/download/v0.11.0/cakeshop-0.11.0.war',
      type: 'jar',
    },
    '0.11.0-J8': {
      name: 'cakeshop.war',
      description: 'Cakeshop 0.11.0-J8',
      url: 'https://github.com/jpmorganchase/cakeshop/releases/download/v0.11.0/cakeshop-0.11.0-J8.war',
      type: 'jar8',
    },
  },

  istanbul: {
    '1.0.3': {
      name: 'istanbul',
      url: {
        darwin: 'https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_v1.0.3_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_v1.0.3_linux_amd64.tar.gz',
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
        darwin: 'https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_v1.9.7_darwin_amd64.tar.gz',
        linux: 'https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_v1.9.7_linux_amd64.tar.gz',
      },
      type: 'tar.gz',
      files: [
        'bootnode',
      ],
    },
  },
}
