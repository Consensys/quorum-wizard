import { createDirectory, isTessera } from '../../utils/networkCreator'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import { copyFile, writeFile, readFileToString, formatNewLine } from '../../utils/fileUtils'
import { buildDockerCompose, createDockerCompose } from '../../utils/dockerHelper'

jest.mock('../../utils/fileUtils')
jest.mock('../../utils/networkCreator')

describe('generates docker-compose directory', () => {
  it('given docker details builds files to run docker', () => {

    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash', false)

    createDirectory.mockReturnValueOnce({tesseraStart:  "",
        gethStart: "",
        initStart: [],
        netPath: "test",
      })
    isTessera.mockReturnValueOnce(true)
    readFileToString.mockReturnValueOnce("test")
    createDockerCompose(config)

    expect(writeFile).toBeCalledTimes(3)
    expect(copyFile).toBeCalledTimes(3)
  })
})

describe('generates docker-compose script details', () => {
  it('creates docker-compose script given config details', () => {

    let config = createQuickstartConfig('1', 'raft', 'tessera', 'bash', false)
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
    readFileToString.mockReturnValueOnce("definitions")
    readFileToString.mockReturnValueOnce("tessera")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")
    formatNewLine.mockReturnValueOnce("tesseraDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })

  it('creates docker-compose script given config details', () => {

    let config = createQuickstartConfig('1', 'raft', 'none', 'bash', false)
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
    readFileToString.mockReturnValueOnce("definitions")
    formatNewLine.mockReturnValueOnce("quorumDefinitions\n")

    expect(buildDockerCompose(config)).toEqual(expected)
  })
})
