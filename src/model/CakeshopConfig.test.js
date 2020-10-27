import { createConfigFromAnswers } from './NetworkConfig'
import { generateCakeshopConfig } from './CakeshopConfig'
import { LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'

const baseNetwork = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  tools: ['cakeshop'],
}

const containerPortInfo = {
  quorum: {
    rpcPort: 8545,
    p2pPort: 21000,
    raftPort: 50400,
    wsPort: 8546,
    graphQlPort: 8547,
  },
  tm: {
    p2pPort: 9000,
    thirdPartyPort: 9080,
  },
}

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    deployment: 'docker-compose',
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
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
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
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
