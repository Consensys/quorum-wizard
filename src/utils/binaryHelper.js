import { createFolder, cwd, exists } from './fileUtils'
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

async function downloadIfMissing (name, version) {
  if(BINARIES[name] === undefined || BINARIES[name][version] === undefined) {
    throw new Error(`Could not find binary info entry for ${name} ${version}`)
  }
  let binDir = join(cwd(), 'bin', name, version)
  if (!exists(binDir)) {
    createFolder(binDir, true)
    console.log(`Downloading ${name} ${version}...`)

    const binaryInfo = BINARIES[name][version]
    const url = getPlatformSpecificUrl(binaryInfo)
    const response = await axios({
      url: url,
      method: 'GET',
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
    console.log('Using cached binary at:', binDir)
  }
}

export async function downloadAndCopyBinaries (config) {
  let quorumVersion = config.network.gethBinary
  if (quorumVersion !== 'PATH') {
    await downloadIfMissing('quorum', quorumVersion)
  }
  let tesseraVersion = config.network.transactionManager
  if (tesseraVersion !== 'PATH') {
    await downloadIfMissing('tessera', tesseraVersion)
  }

  if (config.network.cakeshop) {
    await downloadIfMissing('cakeshop', '0.11.0-RC2')
  }

  if (config.network.generateKeys) {
    await downloadIfMissing('bootnode', 'geth1.8.27')
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
  return Object.entries(BINARIES.quorum).map((entry) => {
    const key = entry[0]
    const binaryInfo = entry[1]
    return {
      name: `Quorum ${key}`,
      value: key,
    }
  })
}

export function getDownloadableTesseraChoices () {
  return Object.entries(BINARIES.tessera).map((entry) => {
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
    const info = BINARIES.quorum[gethBinary]
    return join(cwd(), 'bin', 'quorum', gethBinary, info.name)
  }
}

export function pathToTesseraJar (transactionManager) {
  if (transactionManager === 'PATH') {
    return '$TESSERA_JAR'
  } else {
    const info = BINARIES.tessera[transactionManager]
    return join(cwd(), 'bin', 'tessera', transactionManager, info.name)
  }
}

export function pathToCakeshop () {
  const info = BINARIES.cakeshop['0.11.0-RC2']
  return join(cwd(), 'bin', 'cakeshop', '0.11.0-RC2', info.name)
}

export function pathToBootnode () {
  const info = BINARIES.bootnode['geth1.8.27']
  return join(cwd(), 'bin', 'bootnode', 'geth1.8.27', info.name)
}


const BINARIES = {
  quorum: {
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
  },

  tessera: {
    '0.10.2': {
      name: 'tessera-app.jar',
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

  bootnode: {
    'geth1.8.27': {
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
  }
}
