import { getFullNetworkPath } from '../generators/networkCreator'
import { createConfigFromAnswers } from './NetworkConfig'
import {
  TEST_CWD,
} from '../utils/testHelper'
import { buildKubernetesResource } from './ResourceConfig'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkCreator')
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: '2.5.0',
  transactionManager: '0.10.2',
  cakeshop: 'none',
  deployment: 'kubernetes',
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
  })
  const kubernetes = buildKubernetesResource(config)
  expect(kubernetes).toMatchSnapshot()
})
