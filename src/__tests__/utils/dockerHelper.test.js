import { createDirectory, isTessera, includeCakeshop } from '../../utils/networkCreator'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import {
  copyFile,
  writeFile,
  readFileToString,
  formatNewLine,
  cwd,
} from '../../utils/fileUtils'
import { buildDockerCompose, createDockerCompose } from '../../utils/dockerHelper'
import { TEST_CWD } from '../testHelper'

jest.mock('../../utils/fileUtils')
jest.mock('../../utils/networkCreator')
cwd.mockReturnValue(TEST_CWD)

describe('generates docker-compose directory', () => {
  it('given docker details builds files to run docker', () => {

    let config = createQuickstartConfig({
      numberNodes: '5',
      consensus: 'raft',
      gethBinary: '2.4.0',
      transactionManager: '0.10.2',
      deployment: 'docker-compose',
      cakeshop: false
    })

    createDirectory.mockReturnValueOnce({tesseraStart:  "",
        gethStart: "",
        initStart: [],
        netPath: "test",
      })
    isTessera.mockReturnValueOnce(true)
    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce("test")
    createDockerCompose(config)

    expect(writeFile).toBeCalledTimes(3)
    expect(copyFile).toBeCalledTimes(3)
  })
})

describe('generates docker-compose script details', () => {
  it('creates docker-compose script with quorum and tessera', () => {

    let config = createQuickstartConfig({
      numberNodes: '1',
      consensus: 'raft',
      gethBinary: '2.4.0',
      transactionManager: '0.10.2',
      deployment: 'docker-compose',
      cakeshop: false
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
    const expected = "quorumDefinitions\ntesseraDefinitions" + services

    isTessera.mockReturnValueOnce(true)
    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce("definitions")
    readFileToString.mockReturnValueOnce("tessera")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")
    formatNewLine.mockReturnValueOnce("tesseraDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script just quorum', () => {

    let config = createQuickstartConfig({
      numberNodes: '1',
      consensus: 'raft',
      gethBinary: '2.4.0',
      transactionManager: 'none',
      deployment: 'docker-compose',
      cakeshop: false
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
    const expected = "quorumDefinitions" + services

    isTessera.mockReturnValueOnce(false)
    includeCakeshop.mockReturnValueOnce(false)
    readFileToString.mockReturnValueOnce("definitions")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum and cakeshop', () => {

    const config = createQuickstartConfig({
      numberNodes: '1',
      consensus: 'raft',
      transactionManager: 'none',
      deployment: 'docker-compose',
      cakeshop: true
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
    const expected = "quorumDefinitions\ncakeshopDefinitions" + services

    isTessera.mockReturnValueOnce(false)
    includeCakeshop.mockReturnValueOnce(true)
    readFileToString.mockReturnValueOnce("quorumDefinitions")
    readFileToString.mockReturnValueOnce("cakeshopDefinitions")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")
    formatNewLine.mockReturnValueOnce("cakeshopDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script with quorum, tessera and cakeshop', () => {

    const config = createQuickstartConfig({
      numberNodes: '1',
      consensus: 'raft',
      transactionManager: '0.10.2',
      deployment: 'docker-compose',
      cakeshop: true
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
    const expected = "quorumDefinitions\ntesseraDefinitions\ncakeshopDefinitions" + services

    isTessera.mockReturnValueOnce(true)
    includeCakeshop.mockReturnValueOnce(true)
    readFileToString.mockReturnValueOnce("definitions")
    readFileToString.mockReturnValueOnce("tessera")
    readFileToString.mockReturnValueOnce("cakeshop")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")
    formatNewLine.mockReturnValueOnce("tesseraDefinitions\n")
    formatNewLine.mockReturnValueOnce("cakeshopDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })
})
