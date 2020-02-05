import { buildDockerCompose } from '../../utils/dockerHelper'
import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft dockerFile tessera no cakeshop', () => {
  const config = createQuickstartConfig({
    numberNodes: '3',
    consensus: 'raft',
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
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
    gethBinary: '2.4.0',
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
    gethBinary: '2.4.0',
    transactionManager: '0.10.2',
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
    gethBinary: '2.4.0',
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
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: false,
    keyGeneration: false,
    networkId: 10,
    genesisLocation: 'none',
    defaultPorts: true,
    nodes: []
  })
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 2nodes raft docker tessera cakeshop custom ports', () => {
  let nodes = [
    {
      quorum: {
        ip: '127.0.0.1',
        devP2pPort: '55001',
        rpcPort: '56000',
        wsPort: '57001',
        raftPort: '80501',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5081',
        p2pPort: '5001',
        enclavePort: '5181',
      }
    },
    {
      quorum: {
        ip: '127.0.0.1',
        devP2pPort: '55001',
        rpcPort: '56001',
        wsPort: '56001',
        raftPort: '80502',
      },
      tm: {
        ip: '127.0.0.1',
        thirdPartyPort: '5082',
        p2pPort: '5002',
        enclavePort: '5182',
      }
    }]
  const config = createCustomConfig({
    numberNodes: '2',
    consensus: 'raft',
    transactionManager: '0.10.2',
    deployment: 'bash',
    cakeshop: true,
    keyGeneration: false,
    networkId: 10,
    genesisLocation: 'none',
    defaultPorts: false,
    nodes: nodes
  })
  const bash = buildDockerCompose(config)
  expect(bash).toMatchSnapshot()
})
