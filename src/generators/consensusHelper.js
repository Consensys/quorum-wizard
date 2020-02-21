import { join } from 'path'
import {
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { executeSync } from '../utils/execUtils'
import nodekeyToAccount from '../utils/web3Helper'
import { pathToIstanbulTools } from './binaryHelper'

export function generateAccounts(nodes, keyPath) {
  const numNodes = nodes.length
  const accounts = {}
  for (let i = 0; i < parseInt(numNodes, 10); i += 1) {
    const numNode = i + 1

    const keyDir = join(keyPath, `key${numNode}`)
    const keyString = readFileToString(join(keyDir, 'key'))
    const key = `0x${JSON.parse(keyString).address}`
    accounts[key] = { balance: '1000000000000000000000000000' }
  }
  return accounts
}

export function generateExtraData(nodes, configDir, keyPath) {
  const configLines = ['vanity = "0x00"']
  const validators = nodes.map((node, i) => {
    const nodeNumber = i + 1
    const keyDir = join(keyPath, `key${nodeNumber}`)
    return nodekeyToAccount(`0x${readFileToString(join(keyDir, 'nodekey'))}`)
  })
  configLines.push(`validators = ${JSON.stringify(validators)}`)

  const istanbulConfigFile = join(configDir, 'istanbul.toml')
  writeFile(istanbulConfigFile, configLines.join('\n'), false)

  const extraDataCmd = `cd ${configDir} && ${pathToIstanbulTools()} extra encode --config ${istanbulConfigFile} | awk '{print $4}' `

  return executeSync(extraDataCmd).toString().trim()
}
