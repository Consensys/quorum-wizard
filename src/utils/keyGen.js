import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { createFolder, copyFile } from './fileUtils'
// import apply from 'async/apply'
// import parallel from 'async/parallel'

export function generateKeys(config, keyPath) {
  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    let keyDir = path.join(keyPath, `key${nodeNumber}`)
    console.log(keyDir)
    createFolder(keyDir, true)

    copyFile(config.network.passwordFile, path.join(keyDir, `password.txt`))

    doExec(keyDir)
    })
}

function doExec(keyDir) {
  var cmd = `cd ${keyDir} && geth account new --keystore ${keyDir} --password password.txt
  bootnode -genkey=nodekey
  bootnode --nodekey=nodekey --writeaddress > enode
  find . -type f -name 'UTC*' -execdir mv {} key ';'`

  execSync(cmd, function(err, stdout, stderr) {
    console.log(stdout)
  })
}
