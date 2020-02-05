import { createQuickstartConfig } from '../../model/NetworkConfig'
import { generateCakeshopConfig } from '../../model/CakeshopConfig'

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'istanbul',
    transactionManager: 'tessera',
    deployment: 'bash',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile no tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash no tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'bash',
    cakeshop: true
  })
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})
