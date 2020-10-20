import { getFullNetworkPath } from '../generators/networkHelper'
import { createConfigFromAnswers } from './NetworkConfig'
import {
  TEST_CWD,
} from '../utils/testHelper'
import { buildKubernetesResource } from './ResourceConfig'
import { LATEST_QUORUM, LATEST_TESSERA} from '../generators/download'
import { getDockerRegistry } from '../generators/dockerHelper'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkHelper')
jest.mock('../generators/dockerHelper')
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)
getDockerRegistry.mockReturnValue('')

const containerPortInfo = {
  quorum: {
    rpcPort: 8545,
    p2pPort: 21000,
    raftPort: 50400,
    wsPort: 8645,
  },
  tm: {
    p2pPort: 9000,
    thirdPartyPort: 9080,
  },
}
const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  tools: [],
  deployment: 'kubernetes',
  containerPorts: {
    dockerSubnet: '',
    ...containerPortInfo,
  },
}

test('creates 5nodes raft kubernetes tessera', () => {
  const config = createConfigFromAnswers(baseNetwork)
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 7nodes istanbul kubernetes generate keys', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    consensus: 'istanbul',
    generateKeys: true,
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 7nodes istanbul docker generate keys', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    deployment: 'docker-compose',
    consensus: 'istanbul',
    generateKeys: true,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 7nodes istanbul docker generate keys no tessera', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    deployment: 'docker-compose',
    consensus: 'istanbul',
    transactionManger: 'none',
    generateKeys: true,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 7nodes istanbul docker generate keys with cakeshop', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    deployment: 'docker-compose',
    consensus: 'istanbul',
    tools: ['cakeshop'],
    cakeshopPort: 8999,
    generateKeys: true,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})

test('creates 7nodes istanbul kubernetes generate keys with cakeshop and prometheus', () => {
  const config = createConfigFromAnswers({
    ...baseNetwork,
    numberNodes: '7',
    deployment: 'kubernetes',
    consensus: 'istanbul',
    tools: ['cakeshop', 'prometheus'],
    cakeshopPort: 8999,
    generateKeys: true,
    containerPorts: {
      dockerSubnet: '172.16.239.0/24',
      ...containerPortInfo,
    },
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})
