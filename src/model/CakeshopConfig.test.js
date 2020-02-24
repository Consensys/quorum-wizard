import { createReplica7NodesConfig } from './NetworkConfig'
import { generateCakeshopConfig } from './CakeshopConfig'

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  deployment: 'bash',
  cakeshop: true,
}

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    deployment: 'docker-compose',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    consensus: 'istanbul',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile no tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    transactionManager: 'none',
    deployment: 'docker-compose',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash no tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    ...baseNetwork,
    consensus: 'istanbul',
    transactionManager: 'none',
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})
