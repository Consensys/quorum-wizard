import { isJava11Plus } from '../utils/execUtils'
import { getFullNetworkPath } from '../generators/networkHelper'
import { isBash } from '../model/NetworkConfig'

export function validateNumberStringInRange(input, low, high) {
  const number = parseInt(input, 10)
  if (number >= low && number <= high) {
    return true
  }
  return `Number must be between ${low} and ${high} (inclusive)`
}

export function validateNetworkId(input) {
  const parsedNumber = parseInt(input, 10)
  if (Number.isNaN(parsedNumber)) {
    return 'Network ID must be a number'
  }
  if (parsedNumber === 1) {
    return 'Ethereum Mainnet has a network id of 1. Please choose another id'
  }
  if (parsedNumber < 0) {
    return 'Network ID must be positive'
  }
  return true
}

export function disableIfWrongJavaVersion({ type }) {
  if (type === 'jar' && !isJava11Plus()) {
    return 'Disabled, requires Java 11+'
  }
  return false
}

export function validatePathLength(name, deployment) {
  const trimmed = name.trim()
  if (trimmed === '') {
    return 'Network name must not be blank.'
  }
  const fullPath = getFullNetworkPath({ network: { name: trimmed } })
  if (isBash(deployment) && fullPath.length > 88) {
    // the max path length for unix sockets is 104-108 characters, depending on the os
    // 88 characters plus /qdata/c1/tm.ipc gets us to 104
    return `The full path to your network folder is ${fullPath.length - 88} character(s) too long. Please choose a shorter name or re-run the wizard in a different folder with a shorter path.`
  }
  return true
}
