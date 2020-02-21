export function validateNumberStringInRange(input, low, high) {
  const number = parseInt(input, 10)
  if (number >= low && number <= high) {
    return true
  }
  return `Number must be between ${low} and ${high} (inclusive)`
}

export function validateNetworkId(input) {
  if (input === '1') {
    return 'Ethereum Mainnet has a network id of 1. Please choose another id'
  }
  if (parseInt(input, 10) < 0) {
    return 'Network ID must be positive'
  }
  return true
}
