import { basename, join } from 'path'
import { createFolder, cwd, exists } from './fileUtils'
import axios from 'axios'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { createWriteStream } from 'fs'
import { BINARIES, getPlatformSpecificUrl } from './binaryHelper'

export async function downloadIfMissing (name, version) {
  if (BINARIES[name] === undefined || BINARIES[name][version] === undefined) {
    throw new Error(`Could not find binary info entry for ${name} ${version}`)
  }
  const binaryInfo = BINARIES[name][version]
  const binDir = join(cwd(), 'bin', name, version)
  const binaryFileLocation = join(binDir, binaryInfo.name)
  if (!exists(binDir)) {
    createFolder(binDir, true)
    const url = getPlatformSpecificUrl(binaryInfo)

    console.log(`Downloading ${name} ${version} from ${url}...`)
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    })

    console.log(`Saving to ${binaryFileLocation}`)
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
          console.log('Done')
          resolve()
        })
        extractorStream.on('error', reject)
      })
    } else {
      const writer = createWriteStream(binaryFileLocation, { mode: 0o755 })
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
    console.log('Using cached binary at:', binaryFileLocation)
  }
}
