import { getFullNetworkPath } from './networkHelper'
import {
  createConfigFromAnswers,
} from '../model/NetworkConfig'
import {
  cwd,
  formatNewLine,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import {
  buildDockerCompose,
  getDockerRegistry,
  initDockerCompose,
  setDockerRegistry,
} from './dockerHelper'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import {
  LATEST_QUORUM,
  LATEST_TESSERA,
  QUORUM_PRE_260,
} from './download'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkHelper')
jest.mock('../utils/log')

cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)
info.mockReturnValue('log')

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  tools: ['cakeshop'],
  deployment: 'docker-compose',
  containerPorts: {
    dockerSubnet: '172.16.239.0/24',
    quorum: {
      rpcPort: 8545,
      p2pPort: 21000,
      raftPort: 50400,
      wsPort: 8645,
      graphQlPort: 8547,
    },
    tm: {
      p2pPort: 9000,
      thirdPartyPort: 9080,
    },
  },
}

describe('sets docker registry with command line flags', () => {
  it('sets registry to empty string when flag is not present', async () => {
    setDockerRegistry(undefined)
    expect(getDockerRegistry()).toBe('')
  })
  it('sets the registry url from the flag', async () => {
    setDockerRegistry('registry.hub.docker.com/')
    expect(getDockerRegistry()).toBe('registry.hub.docker.com/')
  })
  it('adds a trailing slash if missing', async () => {
    setDockerRegistry('registry.hub.docker.com')
    expect(getDockerRegistry()).toBe('registry.hub.docker.com/')
  })
  it('throws an error if you include the url scheme', async () => {
    expect(() => setDockerRegistry('http://registry.hub.docker.com')).toThrow(new Error('Docker registry url should NOT include http(s):// at the beginning'))
  })
})

describe('generates docker-compose directory', () => {
  it('given docker details builds files to run docker', async () => {
    const config = createConfigFromAnswers(baseNetwork)

    readFileToString.mockReturnValueOnce('test')
    await initDockerCompose(config)

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'qdata', 'cakeshop', 'local', 'application.properties'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'docker-compose.yml'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), '.env'),
      expect.anything(),
      false,
    )
  })
  it('given docker details builds files to run docker', async () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      tools: [],
      transactionManager: 'none',
      quorumVersion: QUORUM_PRE_260,
    })

    readFileToString.mockReturnValueOnce('test')
    await initDockerCompose(config)

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), 'docker-compose.yml'),
      expect.anything(),
      false,
    )

    expect(writeFile).toBeCalledWith(
      joinPath(getFullNetworkPath(), '.env'),
      expect.anything(),
      false,
    )
  })
})

describe('generates docker-compose script details', () => {
  it('creates docker-compose script with quorum and tessera', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      numberNodes: '1',
      tools: [],
    })
    const services = `
services:
  node1:
    << : *quorum-def
    container_name: node1-1-nodes-raft-tessera-docker-compose
    hostname: node1
    ports:
      - "22000:8545"
      - "23000:8645"
      - "24000:8547"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    depends_on:
      - txmanager1
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc
      - NODE_ID=1
    networks:
      1-nodes-raft-tessera-docker-compose-net:
        ipv4_address: 172.16.239.11
    
  txmanager1:
    << : *tx-manager-def
    container_name: txmanager1-1-nodes-raft-tessera-docker-compose
    hostname: txmanager1
    ports:
      - "9081:9080"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    networks:
      1-nodes-raft-tessera-docker-compose-net:
        ipv4_address: 172.16.239.101
    environment:
      - NODE_ID=1
    
networks:
  1-nodes-raft-tessera-docker-compose-net:
    name: 1-nodes-raft-tessera-docker-compose-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":`
    const expected = `quorumDefinitions\ntesseraDefinitions${services}`

    readFileToString.mockReturnValueOnce('definitions')
    readFileToString.mockReturnValueOnce('tessera')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('tesseraDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script just quorum', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      numberNodes: '1',
      transactionManager: 'none',
      tools: [],
      consensus: 'istanbul',
    })
    const services = `
services:
  node1:
    << : *quorum-def
    container_name: node1-1-nodes-istanbul-docker-compose
    hostname: node1
    ports:
      - "22000:8545"
      - "23000:8645"
      - "24000:8547"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    environment:
      - PRIVATE_CONFIG=ignore
      - NODE_ID=1
    networks:
      1-nodes-istanbul-docker-compose-net:
        ipv4_address: 172.16.239.11
    
networks:
  1-nodes-istanbul-docker-compose-net:
    name: 1-nodes-istanbul-docker-compose-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":`
    const expected = `quorumDefinitions${services}`

    readFileToString.mockReturnValueOnce('definitions')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum and cakeshop', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      numberNodes: '1',
      transactionManager: 'none',
    })
    const services = `
services:
  node1:
    << : *quorum-def
    container_name: node1-1-nodes-raft-docker-compose
    hostname: node1
    ports:
      - "22000:8545"
      - "23000:8645"
      - "24000:8547"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    environment:
      - PRIVATE_CONFIG=ignore
      - NODE_ID=1
    networks:
      1-nodes-raft-docker-compose-net:
        ipv4_address: 172.16.239.11
    
  cakeshop:
    << : *cakeshop-def
    container_name: cakeshop-1-nodes-raft-docker-compose
    hostname: cakeshop
    ports:
      - "8999:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      1-nodes-raft-docker-compose-net:
        ipv4_address: 172.16.239.75
    
networks:
  1-nodes-raft-docker-compose-net:
    name: 1-nodes-raft-docker-compose-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions\ncakeshopDefinitions${services}`

    readFileToString.mockReturnValueOnce('quorumDefinitions')
    readFileToString.mockReturnValueOnce('cakeshopDefinitions')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('cakeshopDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum, tessera and cakeshop', () => {
    const config = createConfigFromAnswers({
      ...baseNetwork,
      numberNodes: '1',
    })
    const services = `
services:
  node1:
    << : *quorum-def
    container_name: node1-1-nodes-raft-tessera-docker-compose
    hostname: node1
    ports:
      - "22000:8545"
      - "23000:8645"
      - "24000:8547"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    depends_on:
      - txmanager1
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc
      - NODE_ID=1
    networks:
      1-nodes-raft-tessera-docker-compose-net:
        ipv4_address: 172.16.239.11
    
  txmanager1:
    << : *tx-manager-def
    container_name: txmanager1-1-nodes-raft-tessera-docker-compose
    hostname: txmanager1
    ports:
      - "9081:9080"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    networks:
      1-nodes-raft-tessera-docker-compose-net:
        ipv4_address: 172.16.239.101
    environment:
      - NODE_ID=1
    
  cakeshop:
    << : *cakeshop-def
    container_name: cakeshop-1-nodes-raft-tessera-docker-compose
    hostname: cakeshop
    ports:
      - "8999:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      1-nodes-raft-tessera-docker-compose-net:
        ipv4_address: 172.16.239.75
    
networks:
  1-nodes-raft-tessera-docker-compose-net:
    name: 1-nodes-raft-tessera-docker-compose-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions\ntesseraDefinitions\ncakeshopDefinitions${services}`

    readFileToString.mockReturnValueOnce('definitions')
    readFileToString.mockReturnValueOnce('tessera')
    readFileToString.mockReturnValueOnce('cakeshop')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('tesseraDefinitions\n')
    formatNewLine.mockReturnValueOnce('cakeshopDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })
})
