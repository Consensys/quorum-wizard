import { prompt } from 'inquirer'
import { promptUser } from './index'
import { getCustomizedBashNodes, getCustomizedCakeshopPort, getCustomizedDockerPorts } from './customPromptHelper'
import { CUSTOM_ANSWERS, QUESTIONS } from './questions'
import { exists } from '../utils/fileUtils'
import { LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'
import { cidrhost } from '../utils/subnetUtils'

jest.mock('inquirer')
jest.mock('../generators/networkHelper')
jest.mock('../generators/networkCreator')
jest.mock('../utils/fileUtils')
jest.mock('../utils/subnetUtils')
exists.mockReturnValue(false)

const SIMPLE_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  tools: [],
}

const CUSTOM_CONFIG = {
  ...SIMPLE_CONFIG,
  generateKeys: false,
  networkId: 10,
  genesisLocation: 'testDir',
  customizePorts: true,
  nodes: ['nodes'],
}

const QUORUM_DOCKER_NODE1 = {
  quorumRpc: '32000',
  quorumWs: '33000',
  quorumGraphQl: '34000',
}

const TESSERA_DOCKER_NODE1 = {
  tessera3Party: '8081',
}

const QUORUM_DOCKER_NODE2 = {
  quorumRpc: '32001',
  quorumWs: '33001',
  quorumGraphQl: '34001',
}

const TESSERA_DOCKER_NODE2 = {
  tessera3Party: '8082',
}

const QUORUM_BASH_NODE1 = {
  quorumIP: '127.0.0.1',
  quorumP2P: '31000',
  quorumRpc: '32000',
  quorumWs: '33000',
  quorumRaft: '40401',
  quorumGraphQl: '34000',
}

const TESSERA_BASH_NODE1 = {
  tesseraIP: '127.0.0.1',
  tesseraP2P: '8001',
  tessera3Party: '8081',
}

const QUORUM_BASH_NODE2 = {
  quorumIP: '127.0.0.1',
  quorumP2P: '31001',
  quorumRpc: '32001',
  quorumWs: '33001',
  quorumRaft: '40402',
  quorumGraphQl: '34001',
}

const TESSERA_BASH_NODE2 = {
  tesseraIP: '127.0.0.1',
  tesseraP2P: '8002',
  tessera3Party: '8082',
}

const CAKESHOP = {
  cakeshopPort: '7999',
}

describe('build customized node info from custom prompts', () => {
  beforeEach(() => {
    prompt.mockClear()
  })
  it('build bash quorum and tessera with raft', async () => {
    prompt.mockResolvedValueOnce({
      ...QUORUM_BASH_NODE1,
      ...TESSERA_BASH_NODE1,
    })
    prompt.mockClear()
    prompt.mockResolvedValueOnce({
      ...QUORUM_BASH_NODE2,
      ...TESSERA_BASH_NODE2,
    })

    const expected = [{
      quorum: {
        devP2pPort: '31000',
        ip: '127.0.0.1',
        raftPort: '40401',
        rpcPort: '32000',
        wsPort: '33000',
        graphQlPort: '34000',
      },
      tm: {
        ip: '127.0.0.1', p2pPort: '8001', thirdPartyPort: '8081',
      },
    }, {
      quorum: {
        devP2pPort: '31001',
        ip: '127.0.0.1',
        raftPort: '40402',
        rpcPort: '32001',
        wsPort: '33001',
        graphQlPort: '34001',
      },
      tm: {
        ip: '127.0.0.1', p2pPort: '8002', thirdPartyPort: '8082',
      },
    }]

    const nodes = await getCustomizedBashNodes(2, true, true)
    expect(nodes).toEqual(expected)
  })

  it('build bash quorum no tessera with istanbul', async () => {
    prompt.mockResolvedValueOnce({
      ...QUORUM_BASH_NODE1,
      quorumRaft: undefined,
    })
    prompt.mockClear()
    prompt.mockResolvedValueOnce({
      ...QUORUM_BASH_NODE2,
      quorumRaft: undefined,
    })

    const expected = [{
      quorum: {
        devP2pPort: '31000',
        ip: '127.0.0.1',
        raftPort: '50401',
        rpcPort: '32000',
        wsPort: '33000',
        graphQlPort: '34000',
      },
    }, {
      quorum: {
        devP2pPort: '31001',
        ip: '127.0.0.1',
        raftPort: '50402',
        rpcPort: '32001',
        wsPort: '33001',
        graphQlPort: '34001',
      },
    }]

    const nodes = await getCustomizedBashNodes(2, false, false)
    expect(nodes).toEqual(expected)
  })

  it('build docker quorum and tessera with raft', async () => {
    prompt.mockResolvedValueOnce({
      ...QUORUM_DOCKER_NODE1,
      ...TESSERA_DOCKER_NODE1,
    })
    prompt.mockClear()
    prompt.mockResolvedValueOnce({
      ...QUORUM_DOCKER_NODE2,
      ...TESSERA_DOCKER_NODE2,
    })

    cidrhost.mockReturnValueOnce('172.16.239.11')
    cidrhost.mockReturnValueOnce('172.16.239.101')
    cidrhost.mockReturnValueOnce('172.16.239.12')
    cidrhost.mockReturnValueOnce('172.16.239.102')

    const expected = [{
      quorum: {
        devP2pPort: '21000',
        ip: '172.16.239.11',
        raftPort: '50401',
        rpcPort: '32000',
        wsPort: '33000',
        graphQlPort: '34000',
      },
      tm: {
        ip: '172.16.239.101', p2pPort: '9001', thirdPartyPort: '8081',
      },
    }, {
      quorum: {
        devP2pPort: '21001',
        ip: '172.16.239.12',
        raftPort: '50402',
        rpcPort: '32001',
        wsPort: '33001',
        graphQlPort: '34001',
      },
      tm: {
        ip: '172.16.239.102', p2pPort: '9002', thirdPartyPort: '8082',
      },
    }]

    const nodes = await getCustomizedDockerPorts(2, true)
    expect(nodes).toEqual(expected)
  })

  it('build docker quorum no tessera with istanbul', async () => {
    prompt.mockResolvedValueOnce({
      ...QUORUM_DOCKER_NODE1,
    })
    prompt.mockClear()
    prompt.mockResolvedValueOnce({
      ...QUORUM_DOCKER_NODE2,
    })

    cidrhost.mockReturnValueOnce('172.16.239.11')
    cidrhost.mockReturnValueOnce('172.16.239.12')

    const expected = [{
      quorum: {
        devP2pPort: '21000',
        ip: '172.16.239.11',
        raftPort: '50401',
        rpcPort: '32000',
        wsPort: '33000',
        graphQlPort: '34000',
      },
    }, {
      quorum: {
        devP2pPort: '21001',
        ip: '172.16.239.12',
        raftPort: '50402',
        rpcPort: '32001',
        wsPort: '33001',
        graphQlPort: '34001',
      },
    }]

    const nodes = await getCustomizedDockerPorts(2, false)
    expect(nodes).toEqual(expected)
  })

  it('build cakeshop customized port', async () => {
    prompt.mockResolvedValueOnce({
      ...CAKESHOP,
    })

    const port = await getCustomizedCakeshopPort()
    expect(port).toEqual('7999')
  })

  describe('prompts the user with different sets of questions based on first choice', () => {
    beforeEach(() => {
      prompt.mockClear()
    })

    it('customize, bash ports', async () => {
      prompt.mockResolvedValue({
        ...CUSTOM_CONFIG,
        tools: ['cakeshop'],
        consensus: 'raft',
      })
      await promptUser('custom')
      expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    })
    it('customize, docker ports', async () => {
      prompt.mockResolvedValue({
        ...CUSTOM_CONFIG,
        deployment: 'docker-compose',
      })
      await promptUser('custom')
      expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    })
  })
})
