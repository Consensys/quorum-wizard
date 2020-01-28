import { buildBashScript } from '../../utils/bashHelper'
import { createQuickstartConfig, createCustomConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft bash tessera', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'bash', false)
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'bash', true)
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 3nodes raft bash tessera custom', () => {
  const config = createCustomConfig('3', 'raft', 'tessera', 'bash', false, false, 10, 'none', true, [])
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})

test('creates 2nodes raft bash tessera cakeshop custom ports', () => {
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
  const config = createCustomConfig('2', 'raft', 'tessera', 'bash', true, false, 10, 'none', false, nodes)
  const bash = buildBashScript(config).startScript
  expect(bash).toMatchSnapshot()
})
