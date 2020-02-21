import { isTessera, isDocker } from './NetworkConfig'

export function generateCakeshopConfig(config) {
  let nodes =[]
  const hasTessera = isTessera(config.network.transactionManager)

  config.nodes.forEach((node, i) => {
    const nodeData = {
      name: `node${i+1}`,
      rpcUrl: isDocker(config.network.deployment) ? `http://host.docker.internal:${node.quorum.rpcPort}`  : `http://localhost:${node.quorum.rpcPort}`,
      transactionManagerUrl: hasTessera ? (isDocker(config.network.deployment) ? `http://host.docker.internal:${node.tm.thirdPartyPort}/partyinfo/keys` : `http://localhost:${node.tm.thirdPartyPort}/partyinfo/keys`) : ''
    }
    nodes.push(nodeData)
  })
  return nodes
}
