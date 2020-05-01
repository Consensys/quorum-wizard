import { info } from '../utils/log'
import { execute } from '../utils/execUtils'
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
import { joinPath } from '../utils/pathUtils'

// eslint-disable-next-line import/prefer-default-export
export async function generateKeys(config, keyPath) {
  const tesseraKeyMsg = isTessera(config.network.transactionManager) ? ' and Tessera' : ''
  info(`Generating ${config.nodes.length} keys for Quorum${tesseraKeyMsg} nodes..`)
  const keygenProcesses = config.nodes.map((node, i) => {
    const nodeNumber = i + 1
    const keyDir = joinPath(keyPath, `key${nodeNumber}`)
    createFolder(keyDir, true)
    writeFile(joinPath(keyDir, 'password.txt'), '')

    return doExec(keyDir, config)
  })

  await Promise.all(keygenProcesses)
  info('Keys were generated')
}

function doExec(keyDir, config) {
  let cmd = `cd ${keyDir} && ${pathToQuorumBinary(config.network.quorumVersion)} account new --keystore ${keyDir} --password password.txt 2>&1
  ${pathToBootnode()} -genkey=nodekey
  ${pathToBootnode()} --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if (isTessera(config.network.transactionManager)) {
    // blank password for now using `< /dev/null` to automatically answer password prompts
    cmd += `java -jar ${pathToTesseraJar(config.network.transactionManager)} -keygen -filename tm < /dev/null`
  }

  return execute(cmd)
}
