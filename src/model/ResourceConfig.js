import { getDockerRegistry } from '../generators/dockerHelper'

export const LATEST_QUBERNETES = 'v0.1.3-rc1'

// eslint-disable-next-line import/prefer-default-export
export function buildKubernetesResource(config) {
  return [
    buildGeneralDetails(config),
    buildQuorumDetails(config),
    buildTesseraDetails(config),
    buildGethDetails(config),
    buildKubernetesDetails(config),
  ].join('')
}

function buildGeneralDetails(config) {
  const nodeNum = config.nodes.length
  return `sep_deployment_files: true
nodes:
  number: ${nodeNum}`
}

function buildQuorumDetails(config) {
  return `
quorum:
  Node_DataDir: /etc/quorum/qdata
  Key_Dir_Base: ${config.network.generateKeys ? 'out/config' : '7nodes'}
  Permissioned_Nodes_File: out/config/permissioned-nodes.json
  Genesis_File: out/config/genesis.json
  quorum:
    consensus: ${config.network.consensus}
    Raft_Port: ${config.containerPorts.quorum.raftPort}
    Quorum_Version: ${config.network.quorumVersion}
    Docker_Repo: ${getDockerRegistry()}quorumengineering`
}

function buildGethDetails(config) {
  return `
geth:
  Node_RPCPort: ${config.containerPorts.quorum.rpcPort}
  NodeP2P_ListenAddr: ${config.containerPorts.quorum.p2pPort}
  network:
    id: ${config.network.networkId}
    public: false
  verbosity: 9
  Geth_Startup_Params: --rpccorsdomain=\\"*\\"`
}

function buildTesseraDetails(config) {
  return `
  tm:
    Name: tessera
    Tm_Version: ${config.network.transactionManager}
    Docker_Repo: ${getDockerRegistry()}quorumengineering
    Port: ${config.containerPorts.tm.p2pPort}
    3Party_Port: ${config.containerPorts.tm.thirdPartyPort}
    Tessera_Config_Dir: out/config`
}

function buildKubernetesDetails(config) {
  return `
k8s:
  service:
    type: NodePort
  storage:
    Type: PVC
    Capacity: 200Mi`
}
