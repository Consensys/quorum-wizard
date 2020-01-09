import { join } from 'path'
import { createNetwork, createStaticNodes } from '../../utils/networkCreator'
import {createConfig} from '../../model/TesseraConfig'
import {
  createQuickstartConfig,
  generateNodeConfigs
} from '../../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  readFileToString,
  writeFile,
  writeJsonFile
} from '../../utils/fileUtils'
import { execute } from '../../utils/execUtils'
import { anything } from 'expect'

jest.mock('../../utils/execUtils')
jest.mock('../../utils/fileUtils')

describe('creates a network', () => {
  it('rejects invalid network names', () => {
    const names = [ '', '.', '..', '\0', '/']
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash')
    names.forEach((name) => {
      config.network.name = name
      expect(() => createNetwork(config)).toThrow(Error)
    })
  })

  it('Creates the correct directory structure and moves files in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash')
    createNetwork(config)
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', anything())
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', anything())
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(config.network.genesisFile, createNetPath(config, `qdata/dd${i}`, 'raft-genesis.json'))
      expect(copyFile).toBeCalledWith(createPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(copyFile).toBeCalledWith(createPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(copyFile).toBeCalledWith(createPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
      expect(copyFile).toBeCalledWith(createPath(`7nodes/key${i}/tm.key`), createNetPath(config, `qdata/c${i}/tm.key`))
      expect(copyFile).toBeCalledWith(createPath(`7nodes/key${i}/tm.pub`), createNetPath(config, `qdata/c${i}/tm.pub`))
      expect(writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/c${i}`), `tessera-config-09-${i}.json`, anything())
    }
    expect(writeFile).toBeCalledWith(createNetPath(config, 'start.sh'), expect.any(String), true)
    expect(copyFile).toBeCalledWith(createPath('lib/stop.sh'), createNetPath(config, 'stop.sh'))
    expect(execute).toBeCalledTimes(5)
  })
})

describe('creates static nodes json', () => {
  it('Creates a raft static nodes json from enode ids', () => {
    const testDir = 'generated'
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0&raftport=50401",
      "enode://def@127.0.0.1:21001?discport=0&raftport=50402",
      "enode://ghi@127.0.0.1:21002?discport=0&raftport=50403",
    ]
    readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'raft', testDir)).toEqual(expected)
  })

  it('Creates an istanbul static nodes json from enode ids', () => {
    const testDir = 'generated'
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0",
      "enode://def@127.0.0.1:21001?discport=0",
      "enode://ghi@127.0.0.1:21002?discport=0",
    ]
    readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'istanbul', testDir)).toEqual(expected)
  })
})

function createPath(...relativePaths) {
  return join(process.cwd(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(process.cwd(), 'network', config.network.name, ...relativePaths)
}
