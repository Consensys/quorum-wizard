import { join } from 'path'
import { executeSync } from '../utils/execUtils'
import { createFolder, readFileToString, writeFile } from '../utils/fileUtils'
import { isTessera } from '../model/NetworkConfig'
import { pathToBootnode, pathToQuorumBinary, pathToTesseraJar } from './binaryHelper'

export function generateKeys(config, keyPath) {
  console.log(`Generating ${config.nodes.length} keys..`)
  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(keyPath, `key${nodeNumber}`)
    createFolder(keyDir, true)
    writeFile(join(keyDir, 'password.txt'), "")

    doExec(keyDir, config)
  })
  console.log('Keys were generated')
}

function doExec(keyDir, config) {
  let cmd = `cd ${keyDir} && ${pathToQuorumBinary(config.network.quorumVersion)} account new --keystore ${keyDir} --password password.txt 2>&1
  ${pathToBootnode()} -genkey=nodekey
  ${pathToBootnode()} --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if(isTessera(config.network.transactionManager)) {
    cmd += `java -jar ${pathToTesseraJar(config.network.transactionManager)} -keygen -filename tm`
  }

  executeSync(cmd)
}
