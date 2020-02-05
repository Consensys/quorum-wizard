import { buildDockerCompose } from '../../utils/dockerHelper'
import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft dockerFile tessera no cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose', false)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera no cakeshop', () => {
  const config = createQuickstartConfig('5', 'istanbul', 'none', 'docker-compose', false)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose', true)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera cakeshop', () => {
  const config = createQuickstartConfig('5', 'istanbul', 'none', 'docker-compose', true)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft docker tessera custom', () => {
  const config = createCustomConfig('3', 'raft', 'tessera', 'docker-compose', false, false, 10, 'none', false, [])
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
  const config = createCustomConfig('2', 'raft', 'tessera', 'docker-compose', true, false, 10, 'none', true, nodes)
  const bash = buildDockerCompose(config)
  expect(bash).toMatchSnapshot()
})
