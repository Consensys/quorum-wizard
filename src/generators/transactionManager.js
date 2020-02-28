import { join } from 'path'
import { readFileToString } from '../utils/fileUtils'
import { isTessera } from '../model/NetworkConfig'
import { getFullNetworkPath } from './networkCreator'

export function formatTesseraKeysOutput(config) {
  if (!isTessera(config.network.transactionManager)) {
    return ''
  }
  const output = config.nodes
    .map((node, i) => loadTesseraPublicKey(config, i + 1))
    .map((publicKey, i) => `Tessera Node ${i + 1} public key:\n${publicKey}`)

  return `--------------------------------------------------------------------------------

${output.join('\n\n')}

--------------------------------------------------------------------------------
`
}

export function loadTesseraPublicKey(config, nodeNumber) {
  return readFileToString(join(getFullNetworkPath(config), 'qdata', `c${nodeNumber}`, 'tm.pub'))
}
