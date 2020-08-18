import { anything } from 'expect'
import {
  createQdataDirectory,
  createStaticNodes,
  createNetwork,
  generateResourcesLocally,
  generateResourcesRemote, createScripts,
} from './networkCreator'
import { getFullNetworkPath } from './networkHelper'
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
  writeFile, writeScript,
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
import SCRIPTS from './scripts'

jest.mock('../utils/execUtils')
jest.mock('../utils/fileUtils')
jest.mock('../utils/log')
jest.mock('../model/ConsensusConfig')
jest.mock('../model/ResourceConfig')
jest.mock('./keyGen')

cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
buildKubernetesResource.mockReturnValue('qubernetes')

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  tools: [],
  deployment: 'bash',
}

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
})

describe('creates network resources with remote qubernetes container from answers', () => {
  it('rejects invalid network names', () => {
    const names = ['', '.', '..', '\0', '/']
    const config = createConfigFromAnswers(baseNetwork)
    names.forEach((name) => {
      config.network.name = name
      expect(() => generateResourcesRemote(config)).toThrow(Error)
    })
  })
  it('Creates new resources and keys for docker using pregen keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'docker-compose',
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
    })
    readFileToString.mockReturnValueOnce('')
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
    expect(copyDirectory).toBeCalledWith(createNetPath(config, 'out', 'config'), createNetPath(config, 'resources'))
  })
  it('Creates new resources and keys for docker with new keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      generateKeys: true,
      deployment: 'docker-compose',
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
    })
    readFileToString.mockReturnValueOnce('')
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
    expect(copyDirectory).toBeCalledWith(createNetPath(config, 'out', 'config'), createNetPath(config, 'resources'))
  })
  it('Creates new resources for kubernetes using pregen keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'kubernetes',
      containerPorts: {
        dockerSubnet: '',
        ...containerPortInfo,
      },
    })
    generateResourcesRemote(config)

    expect(buildKubernetesResource).toHaveBeenCalled()
    expect(writeFile).toBeCalledWith(createNetPath(config, 'qubernetes.yaml'), anything(), false)
  })
  it('Creates new resources for kubernetes with new keys', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'kubernetes',
      generateKeys: true,
      containerPorts: {
        dockerSubnet: '',
        ...containerPortInfo,
      },
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
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
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
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'acctkeyfile.json'),
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
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'acctkeyfile.json'),
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
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
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
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
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
        joinPath(getFullNetworkPath(config), 'resources', `key${i}`, 'acctkeyfile.json'),
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
      expect(copyFile).toBeCalledWith(
        joinPath(getFullNetworkPath(config), 'resources', 'tessera-config-9.0.json'),
        joinPath(createNetPath(config, `qdata/c${i}`), 'tessera-config-09.json'),
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

describe('creates scripts for networks', () => {
  it('Generates the correct files for bash', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
    })
    createScripts(config)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.start)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.stop)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.attach)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.runscript)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.publicContract)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.privateContract)
    expect(writeScript).not.toBeCalledWith(createNetPath(config), config, SCRIPTS.getEndpoints)
  })
  it('Generates the correct files for bash, no tessera', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      transactionManager: 'none',
    })
    createScripts(config)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.start)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.stop)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.attach)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.runscript)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.publicContract)
    expect(writeScript).not.toBeCalledWith(createNetPath(config), config, SCRIPTS.privateContract)
    expect(writeScript).not.toBeCalledWith(createNetPath(config), config, SCRIPTS.getEndpoints)
  })
  it('Generates the correct files for docker', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'docker-compose',
      containerPorts: {
        dockerSubnet: '172.16.239.0/24',
        ...containerPortInfo,
      },
    })
    createScripts(config)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.start)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.stop)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.attach)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.runscript)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.publicContract)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.privateContract)
    expect(writeScript).not.toBeCalledWith(createNetPath(config), config, SCRIPTS.getEndpoints)
  })
  it('Generates the correct files for kubernetes', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      deployment: 'kubernetes',
    })
    createScripts(config)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.start)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.stop)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.attach)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.runscript)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.publicContract)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.privateContract)
    expect(writeScript).toBeCalledWith(createNetPath(config), config, SCRIPTS.getEndpoints)
  })
})
