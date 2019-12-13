import { createQuickstartConfig } from '../../model/NetworkConfig'

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
test('creates 7nodes istanbul config', () => {
  const config = createQuickstartConfig('7', 'istanbul', 'bash')
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft config', () => {
  const config = createQuickstartConfig('5', 'raft', 'bash')
  expect(config).toMatchSnapshot()
})
