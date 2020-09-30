import { readFileToString } from '../utils/fileUtils'
import {
  isTessera,
  isKubernetes,
} from '../model/NetworkConfig'
import { getFullNetworkPath } from './networkHelper'
import { joinPath } from '../utils/pathUtils'

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
  const keyPath = isKubernetes(config.network.deployment)
    ? joinPath(getFullNetworkPath(config), 'out', 'config', `key${nodeNumber}`)
    : joinPath(getFullNetworkPath(config), 'qdata', `c${nodeNumber}`)
  return readFileToString(joinPath(keyPath, 'tm.pub'))
}
