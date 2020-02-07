import { createQuickstartConfig, createReplica7NodesConfig } from '../../model/NetworkConfig'
import { generateCakeshopConfig } from '../../model/CakeshopConfig'

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'istanbul',
    quorumVersion: '2.4.0',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile no tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'raft',
    quorumVersion: '2.4.0',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash no tessera cakeshop', () => {
  const config = createReplica7NodesConfig({
    numberNodes: '3',
    consensus: 'istanbul',
    quorumVersion: '2.4.0',
    transactionManager: 'none',
    deployment: 'bash',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})
