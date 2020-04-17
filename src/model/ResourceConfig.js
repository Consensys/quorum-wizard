import { isTessera } from './NetworkConfig'

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
generate_keys: ${config.network.generateKeys}
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
  Key_Dir_Base: out/config
  Permissioned_Nodes_File: out/config/permissioned-nodes.json
  Genesis_File: out/config/genesis.json
  quorum:
    Raft_Port: ${config.nodes[0].quorum.raftPort}
    Quorum_Version: ${config.network.quorumVersion}
  storage:
    Type: PVC
    Capacity: 200Mi`
}

function buildGethDetails(config) {
  return `
geth:
  Node_RPCPort: 8545
  NodeP2P_ListenAddr: 30303
  network:
    id: ${config.network.networkId}
    public: false
  verbosity: 9
  Geth_Startup_Params: --rpccorsdomain=\\"*\\"`
}

function buildTesseraDetails(config) {
  const hasTessera = isTessera(config.network.transactionManager)
  return hasTessera
    ? `
  tm:
    Name: tessera
    Tm_Version: ${config.network.transactionManager}
    Port: ${config.nodes[0].tm.thirdPartyPort}
    Tessera_Config_Dir: out/config`
    : ''
}
