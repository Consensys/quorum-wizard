import {
  libRootDir,
  writeFile,
  copyScript,
  createFolder,
  copyDirectory,
} from '../utils/fileUtils'
import { isTessera } from '../model/NetworkConfig'
import { getFullNetworkPath } from './networkCreator'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

export function buildKubernetes(config) {
  return [
    buildGeneralDetails(config),
    buildQuorumDetails(config),
    buildTesseraDetails(config),
    buildGethDetails(config),
  ].join('')
}

// eslint-disable-next-line import/prefer-default-export
export async function createKubernetes(config) {
  info('Building kubernetes file...')
  const file = buildKubernetes(config)

  const networkPath = getFullNetworkPath(config)

  info('Writing start script...')

  if (!config.network.generateKeys) {
    createFolder(joinPath(networkPath, 'out', 'config'), true)
    copyDirectory(joinPath(libRootDir(), '7nodes'), joinPath(networkPath, 'out', 'config'))
  }

  const startCommands = `
kind create cluster --name ${config.network.name}-qube
docker run -v $(pwd)/qubernetes.yaml:/qubernetes/qubernetes.yaml -v $(pwd)/quorum-init:/qubernetes/quorum-init -v $(pwd)/out:/qubernetes/out -it  quorumengineering/qubernetes ./quorum-init qubernetes.yaml
kubectl apply -f out -f out/deployments
`

  copyScript(joinPath(libRootDir(), 'lib', 'quorum-init'), joinPath(networkPath, 'quorum-init'))
  writeFile(joinPath(networkPath, 'qubernetes.yaml'), file, false)
  writeFile(joinPath(networkPath, 'start.sh'), startCommands, true)
  writeFile(joinPath(networkPath, 'stop.sh'), `kind delete cluster --name ${config.network.name}-qube`, true)
  info('Done')
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
