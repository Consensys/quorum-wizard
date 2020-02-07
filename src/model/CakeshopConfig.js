import { isTessera } from './NetworkConfig'

export function generateCakeshopConfig(config) {
  let nodes =[]
  const isDocker = config.network.deployment === 'docker-compose'
  const hasTessera = isTessera(config)

  config.nodes.forEach((node, i) => {
    const nodeData = {
      name: `node${i+1}`,
      rpcUrl: isDocker ? `http://host.docker.internal:${node.quorum.rpcPort}`  : `http://localhost:${node.quorum.rpcPort}`,
      transactionManagerUrl: hasTessera ? (isDocker ? `http://host.docker.internal:${node.tm.thirdPartyPort}/partyinfo/keys` : `http://localhost:${node.tm.thirdPartyPort}/partyinfo/keys`) : ''
    }
    nodes.push(nodeData)
  })
  return nodes
}
