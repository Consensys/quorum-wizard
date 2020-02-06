import { join } from 'path'
import { executeSync } from './execUtils'
import { createFolder, copyFile } from './fileUtils'
import { isTessera } from '../model/NetworkConfig'
import { pathToBootnode, pathToGethBinary, pathToTesseraJar } from './binaryHelper'

export function generateKeys(config, keyPath) {
  console.log(`Generating ${config.nodes.length} keys..`)
  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(keyPath, `key${nodeNumber}`)
    createFolder(keyDir, true)
    copyFile(config.network.passwordFile, join(keyDir, 'password.txt'))

    doExec(keyDir, config)
  })
  console.log('Keys were generated')
}

function doExec(keyDir, config) {
  let cmd = `cd ${keyDir} && ${pathToGethBinary(config.network.gethBinary)} account new --keystore ${keyDir} --password password.txt
  ${pathToBootnode()} -genkey=nodekey
  ${pathToBootnode()} --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if(isTessera(config)) {
    cmd += `java -jar ${pathToTesseraJar(config.network.transactionManager)} -keygen -filename tm`
  }

  executeSync(cmd)
}
