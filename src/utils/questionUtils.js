
function validateNumberStringInRange(input, low, high) {
  const number = parseInt(input, 10)
  if (number < low || number > high) {
    return `Number must be in range ${low} to ${high} (inclusive)`
  }
  return true
}

module.exports = {
  validateNumberStringInRange
}
