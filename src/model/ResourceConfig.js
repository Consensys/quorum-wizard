import { getDockerRegistry } from '../generators/dockerHelper'
import { isCakeshop, isKubernetes } from './NetworkConfig'

export const LATEST_QUBERNETES = 'v0.2.1-rc2'

// eslint-disable-next-line import/prefer-default-export
export function buildKubernetesResource(config) {
  return [
    buildKubernetesDetails(config),
    buildCakeshopDetails(config),
    buildPrometheusDetails(config),
    buildGenesisDetails(config),
    buildNodesDetails(config),
  ].join('')
}

function buildGenesisDetails(config) {
  // even when not using tessera, qubernetes generates the resources for it anyways
  // pass the pre-1.0.0 version so that qubernetes does not include the privacyEnhancementsBlock in the genesis file
  // including this flag in the config without a compatible version of tessera will cause Quorum to fail to start
  const tesseraVersion = config.network.transactionManager === 'none' ? '0.11.0' : config.network.transactionManager
  return `
genesis:
  consensus: ${config.network.consensus}
  Quorum_Version: ${config.network.quorumVersion}
  Tm_Version: ${tesseraVersion}
  Chain_Id: ${config.network.networkId}`
}

function buildGeneralDetails(config, i) {
  const nodeName = !isKubernetes(config.network.deployment) ? `"%QUORUM-NODE${i + 1}_SERVICE_HOST%"` : `quorum-node${i + 1}`
  return `
  - Node_UserIdent: ${nodeName}
    Key_Dir_Base: ${config.network.generateKeys ? 'out/config' : '7nodes'}
    Key_Dir: key${i + 1}
    Permissioned_Nodes_File: out/config/permissioned-nodes.json`
}

function buildNodeDetails(config, i) {
  return [
    buildGeneralDetails(config, i),
    buildQuorumDetails(config),
    buildTesseraDetails(config),
    buildGethDetails(config),
  ].join('')
}

function buildNodesDetails(config) {
  const numNodes = config.nodes.length
  let nodeString = ''
  for (let i = 0; i < parseInt(numNodes, 10); i += 1) {
    nodeString += buildNodeDetails(config, i)
  }
  return `
nodes:
  ${nodeString}`
}

function buildQuorumDetails(config) {
  return `
    quorum:
      quorum:
        consensus: ${config.network.consensus}
        Quorum_Version: ${config.network.quorumVersion}
        Docker_Repo: ${getDockerRegistry()}quorumengineering`
}

function buildGethDetails(config) {
  return `
    geth:
      network:
        id: ${config.network.networkId}
        public: false
      verbosity: 9
      Geth_Startup_Params: --rpccorsdomain=\\"*\\" --rpcvhosts=\\"*\\" --wsorigins=\\"*\\"`
}

function buildTesseraDetails(config) {
  return `
      tm:
        Name: tessera
        Tm_Version: ${config.network.transactionManager}
        Docker_Repo: ${getDockerRegistry()}quorumengineering
        Tessera_Config_Dir: out/config`
}

function buildCakeshopDetails(config) {
  if (!isCakeshop(config.network.cakeshop)) {
    return ''
  }
  return `
cakeshop:
  version: latest
  Docker_Repo: ${getDockerRegistry()}quorumengineering
  service:
    type: NodePort
    nodePort: ${config.network.cakeshopPort}`
}

function buildPrometheusDetails(config) {
  if (!config.network.prometheus) {
    return ''
  }
  return `
prometheus:
  # override the default monitor startup params --metrics --metrics.expensive --pprof --pprofaddr=0.0.0.0.
  #monitor_params_geth: --metrics --metrics.expensive --pprof --pprofaddr=0.0.0.0
  nodePort_prom: 31323`
}

function buildKubernetesDetails() {
  return `
k8s:
  sep_deployment_files: true
  service:
    type: NodePort
  storage:
    Type: PVC
    Capacity: 200Mi`
}
