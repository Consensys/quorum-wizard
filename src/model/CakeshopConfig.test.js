import { createConfigFromAnswers } from './NetworkConfig'
import { generateCakeshopConfig } from './CakeshopConfig'
import { LATEST_CAKESHOP, LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'
import { cidrhost } from '../utils/subnetUtils'

jest.mock('../utils/subnetUtils')
cidrhost.mockReturnValue('172.16.239.11')

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  cakeshop: LATEST_CAKESHOP,
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
