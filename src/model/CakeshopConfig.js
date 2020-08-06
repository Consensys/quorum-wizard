import {
  isDocker,
  isTessera,
} from './NetworkConfig'

// eslint-disable-next-line import/prefer-default-export
export function generateCakeshopConfig(config) {
  const nodes = []

  config.nodes.forEach((node, i) => {
    const nodeData = {
      name: `node${i + 1}`,
      rpcUrl: isDocker(config.network.deployment)
        // docker-compose creates dns entries for the container's ip using container name (nodeX)
        ? `http://node${i + 1}:${config.containerPorts.quorum.rpcPort}`
        : `http://localhost:${node.quorum.rpcPort}`,
      transactionManagerUrl: createTransactionManagerUrl(config, node, i),
    }
    nodes.push(nodeData)
  })
  return nodes
}

function createTransactionManagerUrl(config, node, i) {
  if (isTessera(config.network.transactionManager)) {
    return isDocker(config.network.deployment)
      // docker-compose creates dns entries for the container's ip using container name (txmanagerX)
      ? `http://txmanager${i + 1}:${config.containerPorts.tm.thirdPartyPort}`
      : `http://localhost:${node.tm.thirdPartyPort}`
  }
  return ''
}
