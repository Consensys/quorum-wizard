import { join } from 'path'
import { executeSync } from './execUtils'
import { createFolder, copyFile } from './fileUtils'
import { isTessera } from '../model/NetworkConfig'

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
  let cmd = `cd ${keyDir} && $BIN_GETH account new --keystore ${keyDir} --password password.txt
  bootnode -genkey=nodekey
  bootnode --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if(isTessera(config)) {
    cmd += `java -jar $BIN_TESSERA -keygen -filename tm`
  }

  executeSync(cmd)
}
