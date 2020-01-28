import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

// rather than having big test jsons that we match to, we can just use snapshot
// tests, where it will compare against the last time you ran and if it's
// different you can review to make sure the changes were intended
test('creates 7nodes istanbul config', () => {
  const config = createQuickstartConfig('7', 'istanbul', 'tessera', 'bash', false)
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM config', () => {
  const config = createQuickstartConfig('5', 'raft', 'none', 'bash', false)
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul docker config', () => {
  const config = createQuickstartConfig('7', 'istanbul', 'tessera', 'docker-compose', false)
  expect(config).toMatchSnapshot()
})

test('creates 5nodes raft no-TM cakeshop docker config', () => {
  const config = createQuickstartConfig('5', 'raft', 'none', 'docker-compose', true)
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul cakeshop config', () => {
  const config = createQuickstartConfig('7', 'istanbul', 'tessera', 'bash', true)
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom config', () => {
  const config = createCustomConfig('6', 'raft', 'tessera', 'bash', false, true, 10, '', true)
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom config', () => {
  const config = createCustomConfig('7', 'istanbul', 'none', 'bash', false, true, 12, '', true)
  expect(config).toMatchSnapshot()
})

test('creates 6nodes raft custom docker config', () => {
  const config = createCustomConfig('6', 'raft', 'tessera', 'docker-compose', false, true, 10, 'testDir', true)
  expect(config).toMatchSnapshot()
})

test('creates 7nodes istanbul no-TM custom docker config', () => {
  const config = createCustomConfig('7', 'istanbul', 'none', 'docker-compose', false, false, 10, '', true)
  expect(config).toMatchSnapshot()
})
