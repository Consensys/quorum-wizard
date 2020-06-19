import {
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { executeSync } from '../utils/execUtils'
import nodekeyToAccount from '../utils/accountHelper'
import { pathToIstanbulTools } from './binaryHelper'
import { joinPath } from '../utils/pathUtils'

export function generateAccounts(nodes, configDir) {
  const numNodes = nodes.length
  const accounts = {}
  for (let i = 0; i < parseInt(numNodes, 10); i += 1) {
    const numNode = i + 1

    const keyDir = joinPath(configDir, `key${numNode}`)
    const keyString = readFileToString(joinPath(keyDir, 'acctkeyfile.json'))
    const key = `0x${JSON.parse(keyString).address}`
    accounts[key] = { balance: '1000000000000000000000000000' }
  }
  return accounts
}

export function generateExtraData(nodes, configDir) {
  const configLines = ['vanity = "0x00"']
  const validators = nodes.map((node, i) => {
    const nodeNumber = i + 1
    const keyDir = joinPath(configDir, `key${nodeNumber}`)
    return nodekeyToAccount(`0x${readFileToString(joinPath(keyDir, 'nodekey'))}`)
  })
  configLines.push(`validators = ${JSON.stringify(validators)}`)

  const istanbulConfigFile = joinPath(configDir, 'istanbul.toml')
  writeFile(istanbulConfigFile, configLines.join('\n'), false)

  const extraDataCmd = `cd ${configDir} && ${pathToIstanbulTools()} extra encode --config ${istanbulConfigFile} | awk '{print $4}' `

  return executeSync(extraDataCmd).toString().trim()
}
