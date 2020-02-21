import {
  createDirectory,
  getFullNetworkPath,
  includeCakeshop,
} from './networkCreator'
import { createReplica7NodesConfig } from '../model/NetworkConfig'
import {
  cwd,
  formatNewLine,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import {
  buildDockerCompose,
  createDockerCompose,
} from './dockerHelper'
import {
  TEST_CWD,
  TEST_LIB_ROOT_DIR,
} from '../utils/testHelper'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkCreator')
cwd.mockReturnValue(TEST_CWD)
libRootDir.mockReturnValue(TEST_LIB_ROOT_DIR)
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)

const baseNetwork = {
  numberNodes: '5',
  consensus: 'raft',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  cakeshop: true,
  deployment: 'docker-compose',
}

describe('generates docker-compose directory', () => {
  it('given docker details builds files to run docker', async () => {
    const config = createReplica7NodesConfig(baseNetwork)

    createDirectory.mockReturnValueOnce({
      tesseraStart: '',
      gethStart: '',
      initStart: [],
    })
    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce('test')
    await createDockerCompose(config)

    expect(writeFile).toBeCalledTimes(3)
  })
})

describe('generates docker-compose script details', () => {
  it('creates docker-compose script with quorum and tessera', () => {
    const config = createReplica7NodesConfig({
      ...baseNetwork,
      numberNodes: '1',
      cakeshop: false,
    })
    const services = `
services:
  node1:
    << : *quorum-def
    hostname: node1
    ports:
      - "22000:8545"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    depends_on:
      - txmanager1
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc
      - NODE_ID=1
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.11
  txmanager1:
    << : *tx-manager-def
    hostname: txmanager1
    ports:
      - "9081:9080"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.101
    environment:
      - NODE_ID=1
networks:
  quorum-examples-net:
    name: quorum-examples-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions\ntesseraDefinitions${services}`

    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce('definitions')
    readFileToString.mockReturnValueOnce('tessera')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('tesseraDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script just quorum', () => {
    const config = createReplica7NodesConfig({
      ...baseNetwork,
      numberNodes: '1',
      transactionManager: 'none',
      cakeshop: false,
    })
    const services = `
services:
  node1:
    << : *quorum-def
    hostname: node1
    ports:
      - "22000:8545"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    environment:
      - PRIVATE_CONFIG=ignore
      - NODE_ID=1
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.11
networks:
  quorum-examples-net:
    name: quorum-examples-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions${services}`

    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce('definitions')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum and cakeshop', () => {
    const config = createReplica7NodesConfig({
      ...baseNetwork,
      numberNodes: '1',
      transactionManager: 'none',
    })
    const services = `
services:
  node1:
    << : *quorum-def
    hostname: node1
    ports:
      - "22000:8545"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    environment:
      - PRIVATE_CONFIG=ignore
      - NODE_ID=1
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.11
  cakeshop:
    << : *cakeshop-def
    hostname: cakeshop
    ports:
      - "8999:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.186
networks:
  quorum-examples-net:
    name: quorum-examples-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions\ncakeshopDefinitions${services}`

    includeCakeshop.mockReturnValueOnce(true)
    readFileToString.mockReturnValueOnce('quorumDefinitions')
    readFileToString.mockReturnValueOnce('cakeshopDefinitions')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('cakeshopDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum, tessera and cakeshop', () => {
    const config = createReplica7NodesConfig({
      ...baseNetwork,
      numberNodes: '1',
    })
    const services = `
services:
  node1:
    << : *quorum-def
    hostname: node1
    ports:
      - "22000:8545"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    depends_on:
      - txmanager1
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc
      - NODE_ID=1
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.11
  txmanager1:
    << : *tx-manager-def
    hostname: txmanager1
    ports:
      - "9081:9080"
    volumes:
      - vol1:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.101
    environment:
      - NODE_ID=1
  cakeshop:
    << : *cakeshop-def
    hostname: cakeshop
    ports:
      - "8999:8999"
    volumes:
      - cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      quorum-examples-net:
        ipv4_address: 172.16.239.186
networks:
  quorum-examples-net:
    name: quorum-examples-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.16.239.0/24
volumes:
  "vol1":
  "cakeshopvol":`
    const expected = `quorumDefinitions\ntesseraDefinitions\ncakeshopDefinitions${services}`

    includeCakeshop.mockReturnValueOnce(true)
    readFileToString.mockReturnValueOnce('definitions')
    readFileToString.mockReturnValueOnce('tessera')
    readFileToString.mockReturnValueOnce('cakeshop')
    formatNewLine.mockReturnValueOnce('quorumDefinitions\n')
    formatNewLine.mockReturnValueOnce('tesseraDefinitions\n')
    formatNewLine.mockReturnValueOnce('cakeshopDefinitions\n')

    expect(buildDockerCompose(config)).toEqual(expected)
  })
})
