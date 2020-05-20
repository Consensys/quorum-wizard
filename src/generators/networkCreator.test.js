import { anything } from 'expect'
import {
  createQdataDirectory,
  createStaticNodes,
  getFullNetworkPath,
  createNetwork,
  generateResourcesLocally,
  generateResourcesRemote,
} from './networkCreator'
import {
  createConfigFromAnswers,
  generateNodeConfigs,
} from '../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  cwd,
  libRootDir,
  readFileToString,
  writeJsonFile,
  removeFolder,
  copyDirectory,
  writeFile,
} from '../utils/fileUtils'
import {
  createNetPath,
  createLibPath,
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import { joinPath } from '../utils/pathUtils'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { buildKubernetesResource } from '../model/ResourceConfig'
import { executeSync } from '../utils/execUtils'
import { LATEST_QUORUM, LATEST_TESSERA } from './download'
import { cidrhost } from '../utils/subnetUtils'

jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
jest.mock('../utils/log')
jest.mock('../model/ConsensusConfig')
jest.mock('../model/ResourceConfig')
jest.mock('./keyGen')
jest.mock('../utils/subnetUtils')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
buildKubernetesResource.mockReturnValue('qubernetes')
cidrhost.mockReturnValue('docker_ip')

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  cakeshop: 'none',
  deployment: 'bash',
}

describe('creates network and config from answers', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers(baseNetwork)
    names.forEach((name) => {
      config.network.name = name
      expect(() => createNetwork(config)).toThrow(Error)
    })
  })

  it('Creates the correct qdata directory structure and moves files in', () => {
    const config = createConfigFromAnswers(baseNetwork)
    createNetwork(config)

    expect(removeFolder).toBeCalledWith(createNetPath(config))
    expect(createFolder).toBeCalledWith(createNetPath(config), true)
    expect(writeJsonFile).toBeCalledWith(createNetPath(config), 'config.json', anything())
  })
})

describe('creates network resources locally from answers', () => {
  it('Creates genesis and static nodes with pregen keys for bash', async () => {
    const config = createConfigFromAnswers(baseNetwork)
    await generateResourcesLocally(config)

    expect(createFolder).toBeCalledWith(createNetPath(config, 'resources'), true)
    expect(copyDirectory).toBeCalledWith(createLibPath('7nodes'), createNetPath(config, 'resources'))
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'resources'), 'permissioned-nodes.json', anything())
  })

  it('Creates genesis and static nodes and generates keys for bash', async () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      generateKeys: true,
    })
    await generateResourcesLocally(config)

    expect(createFolder).toBeCalledWith(createNetPath(config, 'resources'), true)
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'resources'), 'permissioned-nodes.json', anything())
  })
  it('Creates genesis and static nodes for docker with pregen keys', async () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'docker-compose',
    })
    await generateResourcesLocally(config)

    expect(createFolder).toBeCalledWith(createNetPath(config, 'resources'), true)
    expect(copyDirectory).toBeCalledWith(createLibPath('7nodes'), createNetPath(config, 'resources'))
    expect(generateConsensusConfig).toHaveBeenCalled()
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'resources'), 'permissioned-nodes.json', anything())
  })
})

describe('creates network resources with remote qubernetes container from answers', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers({
      ...baseNetwork,
      containerPorts: {
        dockerSubnet: 'docker_ip',
      },
    })
    names.forEach((name) => {
      config.network.name = name
      expect(() => generateResourcesRemote(config)).toThrow(Error)
    })
  })
  it('Creates new resources and keys for docker', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      generateKeys: true,
      deployment: 'docker-compose',
      containerPorts: {
        dockerSubnet: 'docker_ip',
      },
    })
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
    expect(copyDirectory).toBeCalledWith(createNetPath(config, 'out', 'config'), createNetPath(config, 'resources'))
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'resources'), 'permissioned-nodes.json', anything())
  })
  it('Creates new resources for kubernetes using pregen keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'kubernetes',
    })
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
    expect(createFolder).toBeCalledWith(createNetPath(config, 'out', 'config'), true)
    expect(copyDirectory).toBeCalledWith(createLibPath('7nodes'), createNetPath(config, 'out', 'config'))
  })
  it('Creates new resources for kubernetes with new keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'kubernetes',
      generateKeys: true,
    })
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
  })
  it('Execution of docker container fails', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      generateKeys: true,
      deployment: 'docker-compose',
    })

    executeSync.mockImplementationOnce(() => {
      throw new Error('docker not running')
    })
    expect(() => generateResourcesRemote(config)).toThrow(Error)
  })
})

describe('creates qdata directory for bash network', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers(baseNetwork)
    names.forEach((name) => {
      config.network.name = name
      expect(() => createQdataDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct qdata directory structure and moves files in', () => {
    const config = createConfigFromAnswers(baseNetwork)
    createQdataDirectory(config)
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/logs'), true)
    for (let i = 1; i < 6; i += 1) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'key'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'key'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'nodekey'),
        createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'password.txt'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'),
      )

      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'genesis.json'),
        createNetPath(config, `qdata/dd${i}`, 'genesis.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'tm.key'),
        createNetPath(config, `qdata/c${i}/tm.key`),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'tm.pub'),
        createNetPath(config, `qdata/c${i}/tm.pub`),
      )
      expect(writeJsonFile).toBeCalledWith(
        createNetPath(config, `qdata/c${i}`),
        `tessera-config-09-${i}.json`,
        anything(),
      )
    }
  })
})

describe('creates qdata directory for bash network no tessera', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers({
      ...baseNetwork,
      transactionManager: 'none',
    })
    names.forEach((name) => {
      config.network.name = name
      expect(() => createQdataDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct qdata directory structure and moves files in', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      transactionManager: 'none',
    })
    createQdataDirectory(config)
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', 'logs'), true)
    for (let i = 1; i < 6; i += 1) {
      expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', `dd${i}`))
      expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', `dd${i}`, 'geth'))
      expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata', `dd${i}`, 'keystore'))
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'key'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'key'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'nodekey'),
        createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'password.txt'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'),
      )

      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'genesis.json'),
        createNetPath(config, `qdata/dd${i}`, 'genesis.json'),
      )
    }
  })
})

describe('creates qdata directory for docker network', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'docker-compose',
    })
    names.forEach((name) => {
      config.network.name = name
      expect(() => createQdataDirectory(config)).toThrow(Error)
    })
  })

  it('Creates the correct qdata directory structure and moves files in', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'docker-compose',
    })
    createQdataDirectory(config)
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/logs'), true)
    for (let i = 1; i < 6; i += 1) {
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/geth`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/dd${i}/keystore`))
      expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/c${i}`))
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'permissioned-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'permissioned-nodes.json'),
        joinPath(createNetPath(config, `qdata/dd${i}`), 'static-nodes.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'key'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'key'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'nodekey'),
        createNetPath(config, `qdata/dd${i}/geth`, 'nodekey'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'password.txt'),
        createNetPath(config, `qdata/dd${i}/keystore`, 'password.txt'),
      )

      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'genesis.json'),
        createNetPath(config, `qdata/dd${i}`, 'genesis.json'),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'tm.key'),
        createNetPath(config, `qdata/c${i}/tm.key`),
      )
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'tm.pub'),
        createNetPath(config, `qdata/c${i}/tm.pub`),
      )
    }
  })
})

describe('creates static nodes json', () => {
  it('Creates a raft static nodes json from enode ids', () => {
    const testDir = 'resources'
    const nodes = generateNodeConfigs(3, 'none', 'bash')
    const expected = [
      'enode://abc@127.0.0.1:21000?discport=0&raftport=50401',
      'enode://def@127.0.0.1:21001?discport=0&raftport=50402',
      'enode://ghi@127.0.0.1:21002?discport=0&raftport=50403',
    ]
    readFileToString
      .mockReturnValueOnce('abc')
      .mockReturnValueOnce('def')
      .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'raft', testDir)).toEqual(expected)
  })

  it('Creates an istanbul static nodes json from enode ids', () => {
    const testDir = 'resources'
    const nodes = generateNodeConfigs(3, 'none', 'bash')
    const expected = [
      'enode://abc@127.0.0.1:21000?discport=0',
      'enode://def@127.0.0.1:21001?discport=0',
      'enode://ghi@127.0.0.1:21002?discport=0',
    ]
    readFileToString
      .mockReturnValueOnce('abc')
      .mockReturnValueOnce('def')
      .mockReturnValueOnce('ghi')
    expect(createStaticNodes(nodes, 'istanbul', testDir)).toEqual(expected)
  })
})
