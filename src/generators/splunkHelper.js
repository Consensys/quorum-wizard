import { info } from '../utils/log'

export function buildSplunkDockerCompose(config) {
  const version = `version: "3.6"
`
  const services = [buildSplunkService(config)]
  info('Splunk>')

  return [
    version,
    'services:',
    services.join(''),
    buildSplunkEndService(config),
  ].join('')
}

function buildSplunkService(config) {
  const networkName = config.network.name
  return `
  splunk:
    image: splunk/splunk:8.0.4-debian
    container_name: splunk-${networkName}
    hostname: splunk
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_HEC_TOKEN=11111111-1111-1111-1111-1111111111113
      - SPLUNK_PASSWORD=changeme
      - SPLUNK_APPS_URL=https://github.com/splunk/ethereum-basics/releases/download/latest/ethereum-basics.tgz,https://splunk-quorum.s3.us-east-2.amazonaws.com/oss-quorum-app-for-splunk_109.tgz
    expose:
      - "8000"
      - "8088"
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000']
      interval: 5s
      timeout: 5s
      retries: 20
    ports:
      - "${config.network.splunkPort}:8000"
    volumes:
      - splunk-var:/opt/splunk/var
      - splunk-etc:/opt/splunk/etc
      - ./out/config/splunk/splunk-config.yml:/tmp/defaults/default.yml
    networks:
      ${networkName}-net:
        ipv4_address: ${config.network.splunkIp}`
}

function buildSplunkEndService(config) {
  const networkName = config.network.name
  return `
networks:
  ${networkName}-net:
    name: ${networkName}-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: ${config.containerPorts.dockerSubnet}
volumes:
  "splunk-var":
  "splunk-etc":`
}

export function buildCadvisorService(config) {
  const networkName = config.network.name
  return `
  cadvisor:
    image: google/cadvisor:latest
    container_name: cadvisor-${networkName}
    hostname: cadvisor
    command:
      - --storage_driver=statsd
      - --storage_driver_host=${config.network.splunkIp}:8125
      - --docker_only=true
    user: root
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - ${networkName}-net
    logging: *default-logging`
}

export function buildEthloggerService(config) {
  const networkName = config.network.name
  let ethloggers = ''

  config.nodes.forEach((node, i) => {
    const instance = i + 1
    ethloggers += `
  ethlogger${instance}:
    image: splunkdlt/ethlogger:latest
    container_name: ethlogger${instance}-${networkName}
    hostname: ethlogger${instance}
    environment:
      - ETH_RPC_URL=http://node${instance}:${config.containerPorts.quorum.rpcPort}
      - NETWORK_NAME=quorum
      - START_AT_BLOCK=genesis
      - SPLUNK_HEC_URL=https://${config.network.splunkIp}:8088
      - SPLUNK_HEC_TOKEN=11111111-1111-1111-1111-1111111111113
      - SPLUNK_EVENTS_INDEX=ethereum
      - SPLUNK_METRICS_INDEX=metrics
      - SPLUNK_INTERNAL_INDEX=metrics
      - SPLUNK_HEC_REJECT_INVALID_CERTS=false
      - COLLECT_PEER_INFO=true
    depends_on:
      - node${instance}
    restart: unless-stopped
    volumes:
      - ethlogger-state${instance}:/app
    networks:
      - ${networkName}-net
    logging: *default-logging`
  })
  return ethloggers
}
