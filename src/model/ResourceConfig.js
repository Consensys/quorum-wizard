import { isKubernetes } from './NetworkConfig'
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
generate_deployment: ${isKubernetes(config.network.deployment)}
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
    Raft_Port: 50401
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
  return `
  tm:
    Name: tessera
    Tm_Version: ${config.network.transactionManager}
    Port: 9001
    Tessera_Config_Dir: out/config`
}
