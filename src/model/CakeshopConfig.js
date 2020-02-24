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
        ? `http://host.docker.internal:${node.quorum.rpcPort}`
        : `http://localhost:${node.quorum.rpcPort}`,
      transactionManagerUrl: createTransactionManagerUrl(config, node),
    }
    nodes.push(nodeData)
  })
  return nodes
}

function createTransactionManagerUrl(config, node) {
  if (isTessera(config.network.transactionManager)) {
    return isDocker(config.network.deployment)
      ? `http://host.docker.internal:${node.tm.thirdPartyPort}/partyinfo/keys`
      : `http://localhost:${node.tm.thirdPartyPort}/partyinfo/keys`
  }
  return ''
}
