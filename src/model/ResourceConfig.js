export const LATEST_QUBERNETES = 'v0.1.2'

// eslint-disable-next-line import/prefer-default-export
export function buildKubernetesResource(config) {
  return [
    buildGeneralDetails(config),
    buildQuorumDetails(config),
    buildTesseraDetails(config),
    buildGethDetails(config),
  ].join('')
}

function buildGeneralDetails(config) {
  const nodeNum = config.nodes.length
  return `#namespace:
#  name: quorum-test
sep_deployment_files: true
nodes:
  number: ${nodeNum}
service:
  type: NodePort`
}

function buildQuorumDetails(config) {
  return `
quorum:
  consensus: ${config.network.consensus}
  Node_DataDir: /etc/quorum/qdata
  Key_Dir_Base: ${config.network.generateKeys ? 'out/config' : '7nodes'}
  Permissioned_Nodes_File: out/config/permissioned-nodes.json
  Genesis_File: out/config/genesis.json
  quorum:
    Raft_Port: ${config.containerPorts.quorum.raftPort}
    Quorum_Version: ${config.network.quorumVersion}
  storage:
    Type: PVC
    Capacity: 200Mi`
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
    Port: ${config.containerPorts.tm.p2pPort}
    3Party_Port: ${config.containerPorts.tm.thirdPartyPort}
    Tessera_Config_Dir: out/config`
}
