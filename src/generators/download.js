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
import { executeSync } from '../utils/execUtils'

const compareVersions = require('compare-versions')

export async function getVersionsBintray(name) {
  const url = `https://api.bintray.com/packages/quorumengineering/${name}`
  const response = await axios({
    url,
    method: 'GET',
  })
  return response.data.versions
}

export async function getLatestVersionGithub(name) {
  const latest = executeSync(`curl -s https://api.github.com/repos/jpmorganchase/${name}/releases/latest`).toString().trim()
  const version = JSON.parse(latest)
  return version.tag_name
}

export async function getVersionsMaven(name) {
  const versions = executeSync(`curl -s https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/${name}/maven-metadata.xml | grep "<version>[0-9].[0-9][0-9].[0-9]</version>" | sort --version-sort -r | uniq | sed -e "s#\\(.*\\)\\(<version>\\)\\(.*\\)\\(</version>\\)\\(.*\\)#\\3#g"`).toString().trim().split('\n')
  return versions
}
// eslint-disable-next-line import/prefer-default-export
export async function downloadIfMissing(name, version) {
  let binaryInfo
  switch (name) {
    case 'quorum':
      binaryInfo = createQuorumBinaryInfo(version)
      break
    case 'cakeshop':
      binaryInfo = createCakeshopBinaryInfo(version)
      break
    case 'tessera':
      binaryInfo = createTesseraBinaryInfo(version)
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

export const LATEST_QUORUM = '2.6.0'
export const LATEST_TESSERA = '0.10.5'
export const LATEST_TESSERA_J8 = '0.10.2'
export const LATEST_CAKESHOP = '0.11.0'
export const LATEST_CAKESHOP_J8 = '0.11.0-J8'
export const LATEST_ISTANBUL_TOOLS = '1.0.3'
export const LATEST_BOOTNODE = '1.9.7'

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

export function createCakeshopBinaryInfo(version) {
  const java8 = version.includes('J8')
  const baseVersion = java8 ? version.substring(0, version.length - 3) : version
  const type = java8 ? 'jar8' : 'jar'
  return {
    name: 'cakeshop.war',
    description: `Cakeshop ${version}`,
    url: `https://github.com/jpmorganchase/cakeshop/releases/download/v${baseVersion}/cakeshop-${version}.war`,
    type,
  }
}

export function createTesseraBinaryInfo(version) {
  const type = compareVersions.compare('10.3.0', version, '<') ? 'jar8' : 'jar'
  return {
    name: 'tessera-app.jar',
    description: `Tessera ${version}`,
    url: `https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/${version}/tessera-app-${version}-app.jar`,
    type,
  }
}

export const BINARIES = {
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
