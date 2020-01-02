import fs from 'fs'
import { join } from 'path'
import { executeSync } from './execUtils'
import { createFolder, copyFile } from './fileUtils'

export function generateKeys(config, keyPath) {
  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(keyPath, `key${nodeNumber}`)
    createFolder(keyDir, true)
    copyFile(config.network.passwordFile, join(keyDir, `password.txt`))

    doExec(keyDir, config.network.tessera)
    })
}

function doExec(keyDir, isTessera) {
  let cmd = `cd ${keyDir} && geth account new --keystore ${keyDir} --password password.txt
  bootnode -genkey=nodekey
  bootnode --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'
  `
  if(isTessera) {
    cmd += `java -jar $TESSERA_JAR -keygen -filename tm`
  }

  executeSync(cmd, function(err, stdout, stderr) {
    if (e instanceof Error) {
      console.error(e)
      throw e
    }
  })
}
