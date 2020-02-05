import { buildDockerCompose } from '../../utils/dockerHelper'
import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft dockerFile tessera no cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: false
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera no cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: false
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '5',
    consensus: 'istanbul',
    transactionManager: 'none',
    deployment: 'docker-compose',
    cakeshop: true
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft docker tessera custom', () => {
  const config = createCustomConfig({
    numberNodes: '3',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: false,
    keyGeneration: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: false,
    nodes: []
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 2nodes raft docker tessera cakeshop custom ports', () => {
  let nodes = [
    {
      quorum: {
        ip: '172.16.239.11',
        devP2pPort: '55001',
        rpcPort: '56000',
        wsPort: '57001',
        raftPort: '80501',
      },
      tm: {
        ip: '172.16.239.101',
        thirdPartyPort: '5081',
        p2pPort: '5001',
        enclavePort: '5181',
      }
    },
    {
      quorum: {
        ip: '172.16.239.12',
        devP2pPort: '55001',
        rpcPort: '56001',
        wsPort: '56001',
        raftPort: '80502',
      },
      tm: {
        ip: '172.16.239.102',
        thirdPartyPort: '5082',
        p2pPort: '5002',
        enclavePort: '5182',
      }
    }]
  let docker = {
    quorumRpcPort: '31000',
    quorumRaftPort: '30400',
    tesseraThirdPartyPort: '3080',
    tesseraP2pPort: '3000'
  }
  const config = createCustomConfig({
    numberNodes: '2',
    consensus: 'raft',
    transactionManager: 'tessera',
    deployment: 'docker-compose',
    cakeshop: true,
    keyGeneration: false,
    networkId: 10,
    genesisLocation: 'none',
    customizePorts: true,
    nodes: nodes,
    dockerCustom: docker
  })
  const bash = buildDockerCompose(config)
  expect(bash).toMatchSnapshot()
})
