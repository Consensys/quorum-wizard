import { createConfigFromAnswers } from './NetworkConfig'
import { generateCakeshopConfig } from './CakeshopConfig'

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.5.0',
  transactionManager: '0.10.4',
  deployment: 'bash',
  cakeshop: '0.11.0',
}

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    deployment: 'docker-compose',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    consensus: 'istanbul',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile no tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    transactionManager: 'none',
    deployment: 'docker-compose',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash no tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    consensus: 'istanbul',
    transactionManager: 'none',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})
