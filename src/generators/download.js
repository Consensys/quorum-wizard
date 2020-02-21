import { basename, join } from 'path'
import { createFolder, exists, libRootDir } from '../utils/fileUtils'
import axios from 'axios'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { createWriteStream } from 'fs'
import { BINARIES, getPlatformSpecificUrl } from './binaryHelper'
import { info } from '../utils/log'

export async function downloadIfMissing (name, version) {
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
      url: url,
      method: 'GET',
      responseType: 'stream',
    })

    info(`Saving to ${binaryFileLocation}`)
    if (binaryInfo.type === 'tar.gz') {
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
          info('Done')
          resolve()
        })
        extractorStream.on('error', reject)
      })
    } else {
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
  } else {
    info(`Using cached ${name} at: ${binaryFileLocation}`)
  }
}
