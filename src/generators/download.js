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

export async function getVersions(name) {
  const url = `https://api.bintray.com/packages/quorumengineering/${name}`
  const response = await axios({
    url,
    method: 'GET',
  })
  return response.data.versions
}

// eslint-disable-next-line import/prefer-default-export
export async function downloadIfMissing(name, version) {
  let binaryInfo
  switch (name) {
    case 'quorum':
      binaryInfo = createQuorumBinaryInfo(version)
      break
    case 'istanbul':
      binaryInfo = createIstanbulBinaryInfo(version)
      break
    case 'bootnode':
      binaryInfo = createBootnodeBinaryInfo(version)
      break
    default:
      binaryInfo = BINARIES[name][version]
  }
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

export function createQuorumBinaryInfo(version) {
  return {
    name: 'geth',
    description: `Quorum ${version}`,
    url: {
      darwin: `https://bintray.com/quorumengineering/quorum/download_file?file_path=${version}/geth_${version}_darwin_amd64.tar.gz`,
      linux: `https://bintray.com/quorumengineering/quorum/download_file?file_path=${version}/geth_${version}_linux_amd64.tar.gz`,
    },
    type: 'tar.gz',
    files: [
      'geth',
    ],
  }
}

export function createIstanbulBinaryInfo(version) {
  return {
    name: 'istanbul',
    url: {
      darwin: `https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_${version}_darwin_amd64.tar.gz`,
      linux: `https://bintray.com/api/ui/download/quorumengineering/istanbul-tools/istanbul-tools_${version}_linux_amd64.tar.gz`,
    },
    type: 'tar.gz',
    files: [
      'istanbul',
    ],
  }
}

export function createBootnodeBinaryInfo(version) {
  return {
    name: 'bootnode',
    url: {
      darwin: `https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_${version}_darwin_amd64.tar.gz`,
      linux: `https://bintray.com/api/ui/download/quorumengineering/geth-bootnode/bootnode_${version}_linux_amd64.tar.gz`,
    },
    type: 'tar.gz',
    files: [
      'bootnode',
    ],
  }
}

export const BINARIES = {
  tessera: {
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
}
