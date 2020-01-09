import {
  writeFile,
  writeJsonFile,
  readFileToString
} from '../utils/fileUtils'
import { join } from 'path'
import { executeSync } from './execUtils'
import { nodekeyToAccount } from './web3Helper'

export function generateAccounts(nodes, configDir) {
  const numNodes = nodes.length
  var accounts = {}
  for (let i = 0; i < parseInt(numNodes, 10); i++) {
    const numNode = i + 1
    const keyDir = join(configDir, `key${numNode}`)
    const keyString = readFileToString(join(keyDir, 'key'))
    const key = `0x${JSON.parse(keyString).address}`
    accounts[key] = {balance : '1000000000000000000000000000'}
  }
  return accounts
}

export function generateExtraData(nodes, configDir) {
  var configLines = ['vanity = \"0x00\"']
  const validators = nodes.map((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(configDir, `key${nodeNumber}`)
    return nodekeyToAccount(`0x${readFileToString(join(keyDir, 'nodekey'))}`)
  })
  configLines.push(`validators = ${JSON.stringify(validators)}`)

  const istanbulConfigFile = join(configDir, 'istanbul.toml')
  writeFile(istanbulConfigFile, configLines.join("\n"), false)

  let extraDataCmd = `cd ${configDir} && istanbul extra encode --config ${istanbulConfigFile} | awk '{print $4}' > extraData`
  executeSync(extraDataCmd, function(err, stdout, stderr) {
    if (e instanceof Error) {
      console.error(e)
      throw e
    }
  })
  return readFileToString(join(configDir, 'extraData'))
}
