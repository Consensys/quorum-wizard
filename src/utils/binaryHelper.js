import { copyFile, createFolder, cwd, exists } from './fileUtils'
import { basename, join } from 'path'
import { createWriteStream } from 'fs'
import axios from 'axios'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { executeSync } from './execUtils'

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

async function downloadIfMissing (version, binaryInfo) {
  let binDir = join(cwd(), 'bin', version)
  if (!exists(binDir)) {
    createFolder(binDir, true)
    console.log(`Downloading ${binaryInfo.name} ${version}...`)

    const url = getPlatformSpecificUrl(binaryInfo)
    const response = await axios.get({
      url: url,
      responseType: 'stream',
    })

    if (binaryInfo.type === 'tar.gz') {
      console.log(`Extracting ${binaryInfo.name} from tar.gz archive`)
      const extractorStream = response.data.pipe(createGunzip())
        .pipe(extract(binDir, {
          map: function (header) {
            const filename = basename(header.name)
            if (binaryInfo.files.includes(filename)) {
              // don't include folders when extracting files we want
              header.name = filename
            }
            return header
          },
          ignore: function (name) {
            return !binaryInfo.files.includes(basename(name))
          },
        }))
      return new Promise((resolve, reject) => {
        extractorStream.on('finish', () => {
          console.log('Done')
          resolve()
        })
        extractorStream.on('error', reject)
      })
    } else {
      console.log(`Writing ${binaryInfo.name} to disk`)
      const writer = createWriteStream(join(binDir, binaryInfo.name),
        { mode: 0o755 })
      response.data.pipe(writer)
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('Done')
          resolve()
        })
        writer.on('error', reject)
      })
    }
  } else {
    // console.log('Binary already exists at', binDir)
  }
}

export async function downloadAndCopyBinaries (config, networkPath) {

  createFolder(join(networkPath, 'bin'))

  let gethVersion = config.network.gethBinary
  if (gethVersion !== 'PATH') {
    let gethBinaryInfo = geth[gethVersion]
    await downloadIfMissing(gethVersion, gethBinaryInfo)
    copyFile(join(cwd(), 'bin', gethVersion, gethBinaryInfo.name), join(networkPath, 'bin', gethBinaryInfo.name))
  }
  let tesseraVersion = config.network.transactionManager
  if (tesseraVersion !== 'PATH') {
    let tesseraBinaryInfo = tessera[tesseraVersion]
    await downloadIfMissing(tesseraVersion, tesseraBinaryInfo)
    copyFile(join(cwd(), 'bin', tesseraVersion, tesseraBinaryInfo.name), join(networkPath, 'bin', tesseraBinaryInfo.name))
  }

  if (config.network.cakeshop) {
    await downloadIfMissing('cakeshop', cakeshop)
    copyFile(join(cwd(), 'bin', 'cakeshop', cakeshop.name), join(networkPath, 'bin', cakeshop.name))
  }

  if (config.network.generateKeys) {
    await downloadIfMissing('bootnode', bootnode)
  }
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
  return Object.entries(geth).map((entry) => {
    const key = entry[0]
    const binaryInfo = entry[1]
    return {
      name: `Quorum ${key}`,
      value: key,
    }
  })
}

export function getDownloadableTesseraChoices () {
  return Object.entries(tessera).map((entry) => {
    const key = entry[0]
    const binaryInfo = entry[1]
    return {
      name: `Tessera ${key}`,
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

export function pathToGethBinary (gethBinary) {
  if (gethBinary === 'PATH') {
    return 'geth'
  } else {
    return 'bin/geth'
  }
}

export function pathToTesseraJar (transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  } else {
    return `bin/${tessera[transactionManager].name}`
  }
}

export function pathToCakeshop () {
  return 'bin/cakeshop.war'
}

const geth = {
  '2.4.0': {
    name: 'geth',
    url: {
      darwin: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.4.0/geth_v2.4.0_darwin_amd64.tar.gz',
      linux: 'https://bintray.com/quorumengineering/quorum/download_file?file_path=v2.4.0/geth_v2.4.0_linux_amd64.tar.gz',
    },
    type: 'tar.gz',
    files: [
      'geth',
    ],
  },
}

const tessera = {
  '0.10.2': {
    name: 'tessera-app.jar',
    url: 'https://oss.sonatype.org/service/local/repositories/releases/content/com/jpmorgan/quorum/tessera-app/0.10.2/tessera-app-0.10.2-app.jar',
    type: 'jar',
  },
}

const cakeshop = {
  name: 'cakeshop.war',
  url: 'https://github.com/jpmorganchase/cakeshop/releases/download/v0.11.0-RC2/cakeshop-0.11.0-RC2.war',
  type: 'war',
}

const bootnode = {
  name: 'bootnode',
  url: {
    darwin: 'https://gethstore.blob.core.windows.net/builds/geth-alltools-darwin-amd64-1.8.27-4bcc0a37.tar.gz',
    linux: 'https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-amd64-1.8.27-4bcc0a37.tar.gz',
  },
  type: 'tar.gz',
  files: [
    'bootnode',
  ],
}
