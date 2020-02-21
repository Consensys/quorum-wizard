import { join } from 'path'
import { info } from '../utils/log'
import { executeSync } from '../utils/execUtils'
import {
  createFolder,
  writeFile,
} from '../utils/fileUtils'
import { isTessera } from '../model/NetworkConfig'
import {
  pathToBootnode,
  pathToQuorumBinary,
  pathToTesseraJar,
} from './binaryHelper'

// eslint-disable-next-line import/prefer-default-export
export function generateKeys(config, keyPath) {
  const tesseraKeyMsg = isTessera(config.network.transactionManager) ? ' and Tessera' : ''
  info(`Generating ${config.nodes.length} keys for Quorum${tesseraKeyMsg} nodes..`)
  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(keyPath, `key${nodeNumber}`)
    createFolder(keyDir, true)
    writeFile(join(keyDir, 'password.txt'), '')

    doExec(keyDir, config)
  })
  info('Keys were generated')
}

function doExec(keyDir, config) {
  let cmd = `cd ${keyDir} && ${pathToQuorumBinary(config.network.quorumVersion)} account new --keystore ${keyDir} --password password.txt 2>&1
  ${pathToBootnode()} -genkey=nodekey
  ${pathToBootnode()} --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if (isTessera(config.network.transactionManager)) {
    cmd += `java -jar ${pathToTesseraJar(config.network.transactionManager)} -keygen -filename tm`
  }

  executeSync(cmd)
}
