import { join } from 'path'
import { info } from '../utils/log'
import {
  cwd,
  readFileToString,
} from '../utils/fileUtils'
import { isTessera } from '../model/NetworkConfig'

// eslint-disable-next-line import/prefer-default-export
export function printTesseraKeys(config, log) {
  let keyString = !log ? 'echo "' : ''
  const qdata = join(cwd(), 'network', config.network.name, 'qdata')
  let pubKey = ''
  if (isTessera(config.network.transactionManager)) {
    keyString += '--------------------------------------------------------------------------------\n'
    config.nodes.forEach((node, i) => {
      const nodeNumber = i + 1
      pubKey = readFileToString(join(qdata, `c${nodeNumber}`, 'tm.pub'))
      keyString += `\nTessera Node ${nodeNumber} public key:\n${pubKey}\n`
    })
    keyString += '\n--------------------------------------------------------------------------------'
    keyString += !log ? '"\n' : '\n'
  }
  if (log) {
    info(keyString)
    return pubKey
  }
  return keyString
}
