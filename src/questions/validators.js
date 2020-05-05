import { isJava11Plus } from '../utils/execUtils'
import { LATEST_CAKESHOP, LATEST_CAKESHOP_J8 } from '../generators/download'

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

export function transformCakeshopAnswer(answer) {
  if (answer === 'Yes') {
    return isJava11Plus() ? LATEST_CAKESHOP : LATEST_CAKESHOP_J8
  }
  return 'none'
}

export function disableIfWrongJavaVersion({ type }) {
  if (type === 'jar8' && isJava11Plus()) {
    return 'Disabled, requires Java 8'
  }
  if (type === 'jar' && !isJava11Plus()) {
    return 'Disabled, requires Java 11+'
  }
  return false
}
