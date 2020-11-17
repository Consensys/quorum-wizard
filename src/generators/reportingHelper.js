import TOML from '@iarna/toml'
import { libRootDir, readFileToString, writeFile } from '../utils/fileUtils'
import { joinPath } from '../utils/pathUtils'
import { cidrhost } from '../utils/subnetUtils'
import { isBash, isDocker } from '../model/NetworkConfig'

export function generateReportingConfig(config, qdataFolder) {
  const reportingConfig = TOML.parse(readFileToString(joinPath(libRootDir(), 'lib', 'reporting-config.toml')))

  if (isDocker(config.network.deployment)) {
    reportingConfig.server.rpcAddr = `0.0.0.0:${config.containerPorts.reporting.rpcPort}`
    reportingConfig.server.uiPort = parseInt(config.containerPorts.reporting.uiPort, 10)
    reportingConfig.connection.wsUrl = `ws://node1:${config.containerPorts.quorum.wsPort}`
    reportingConfig.connection.graphQLUrl = `http://node1:${config.containerPorts.quorum.graphQlPort}/graphql`
  } else if (isBash(config.network.deployment)) {
    reportingConfig.server.rpcAddr = `localhost:${config.network.reportingRpcPort}`
    reportingConfig.server.uiPort = parseInt(config.network.reportingUiPort, 10)
    reportingConfig.connection.wsUrl = `ws://localhost:${config.nodes[0].quorum.wsPort}`
    reportingConfig.connection.graphQLUrl = `http://localhost:${config.nodes[0].quorum.graphQlPort}/graphql`
    // use in-memory db in bash mode by deleting database section
    delete reportingConfig.database
  }

  writeFile(joinPath(qdataFolder, 'reporting-config.toml'), TOML.stringify(reportingConfig))
}

export function generateReportingScript(config) {
  if (!config.network.reporting) {
    return ''
  }
  return `echo Starting Quorum Reporting...
sleep 10
quorum-report -config qdata/reporting-config.toml > qdata/logs/reporting.log &`
}

export function generateReportingService(config) {
  return `
  reporting:
    << : *reporting-def
    container_name: reporting-${(config.network.name)}
    hostname: reporting
    ports:
      - "${config.network.reportingRpcPort}:${config.containerPorts.reporting.rpcPort}"
      - "${config.network.reportingUiPort}:${config.containerPorts.reporting.uiPort}"
    volumes:
      - ./qdata/reporting-config.toml:/config/reporting-config.toml
    networks:
      ${(config.network.name)}-net:
        ipv4_address: ${cidrhost(config.containerPorts.dockerSubnet, 65)}`
}

export function generateElasticsearchService(config) {
  return `
  es:
    image: elasticsearch:7.9.2
    container_name: es
    environment:
      - node.name=es
      - bootstrap.memory_lock=true
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esvol:/usr/share/elasticsearch/data
    ports:
      - 9200:9200
    networks:
      ${(config.network.name)}-net:
        ipv4_address: ${cidrhost(config.containerPorts.dockerSubnet, 66)}`
}
