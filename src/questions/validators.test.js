import { validateNumberStringInRange } from './validators'

test('accepts answer bottom of range', () => {
  expect(validateNumberStringInRange("2", 2, 3)).toBe(true)
})

test('accepts answer top of range', () => {
  expect(validateNumberStringInRange("3", 2, 3)).toBe(true)
})

test('rejects answer outside of range', () => {
  expect(validateNumberStringInRange("1", 2, 3)).toEqual("Number must be between 2 and 3 (inclusive)")
})

test('rejects answer that is not a number string', () => {
  expect(validateNumberStringInRange("on", 2, 3)).toEqual("Number must be between 2 and 3 (inclusive)")
})
