import path from 'path'
import * as fileUtils from '../../utils/fileUtils'
import * as execUtils from '../../utils/execUtils'
import { createNetwork, createStaticNodes } from '../../utils/networkCreator'
import {
  createQuickstartConfig,
  generateNodeConfigs
} from '../../model/NetworkConfig'

jest.mock('../../utils/execUtils', () => ({
  execute: jest.fn()
}))
jest.mock('../../utils/fileUtils', () => ({
  copyFile: jest.fn(),
  createFolder: jest.fn(),
  removeFolder: jest.fn(),
  writeFile: jest.fn(),
  writeJsonFile: jest.fn(),
  readFileToString: jest.fn()
}))

describe('creates a network', () => {
  it('rejects invalid network names', () => {
    const names = [ '', '.', '..', '\0', '/']
    let config = createQuickstartConfig('5', 'raft', 'bash')
    names.forEach((name) => {
      config.network.name = name
      expect(() => createNetwork(config)).toThrow(Error)
    })
  })

  it('Creates the correct directory structure and moves files in', () => {
    let config = createQuickstartConfig('5', 'raft', 'bash')
    createNetwork(config)
    expect(fileUtils.createFolder).toBeCalledWith(createNetPath(config, `qdata/logs`), true)
    expect(fileUtils.writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', config)
    for (let i = 1; i < 6; i++) {
      expect(fileUtils.createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(fileUtils.writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json', expect.anything())
      expect(fileUtils.writeJsonFile).toBeCalledWith(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json', expect.anything())
      expect(fileUtils.createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(fileUtils.createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(fileUtils.createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(fileUtils.copyFile).toBeCalledWith(config.network.genesisFile, createNetPath(config, `qdata/dd${i}`, 'genesis.json'))
      expect(fileUtils.copyFile).toBeCalledWith(createPath(`7nodes/key${i}/key`), createNetPath(config, `qdata/dd${i}/keystore`, 'key'))
      expect(fileUtils.copyFile).toBeCalledWith(createPath(`7nodes/key${i}/password.txt`), createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'))
      expect(fileUtils.copyFile).toBeCalledWith(createPath(`7nodes/key${i}/nodekey`), createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'))
      expect(fileUtils.copyFile).toBeCalledWith(createPath(`7nodes/key${i}/tm.key`), createNetPath(config, `qdata/c${i}/tm.key`))
      expect(fileUtils.copyFile).toBeCalledWith(createPath(`7nodes/key${i}/tm.pub`), createNetPath(config, `qdata/c${i}/tm.pub`))
    }
    expect(fileUtils.writeFile).toBeCalledWith(createNetPath(config, 'start.sh'), expect.any(String), true)
    expect(fileUtils.copyFile).toBeCalledWith(createPath(`lib/stop.sh`), createNetPath(config, 'stop.sh'))
    expect(execUtils.execute).toBeCalledTimes(5)
  })
})

describe('creates static nodes json', () => {
  it('Creates a raft static nodes json from enode ids', () => {
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0&raftport=50401",
      "enode://def@127.0.0.1:21001?discport=0&raftport=50402",
      "enode://ghi@127.0.0.1:21002?discport=0&raftport=50403",
    ]
    fileUtils.readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'raft')).toEqual(expected)
  })

  it('Creates an istanbul static nodes json from enode ids', () => {
    const nodes = generateNodeConfigs(3)
    const expected = [
      "enode://abc@127.0.0.1:21000?discport=0",
      "enode://def@127.0.0.1:21001?discport=0",
      "enode://ghi@127.0.0.1:21002?discport=0",
    ]
    fileUtils.readFileToString
    .mockReturnValueOnce('abc')
    .mockReturnValueOnce('def')
    .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'istanbul')).toEqual(expected)
  })
})

function createPath(...relativePaths) {
  return path.join(process.cwd(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return path.join(process.cwd(), 'network', config.network.name, ...relativePaths)
}
