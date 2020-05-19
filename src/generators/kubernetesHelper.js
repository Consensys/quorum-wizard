import {
  writeFile,
} from '../utils/fileUtils'
import {
  getFullNetworkPath,
} from './networkCreator'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'

// eslint-disable-next-line import/prefer-default-export
export async function createKubernetes(config) {
  const networkPath = getFullNetworkPath(config)

  info('Writing start script...')

  writeFile(joinPath(networkPath, 'start.sh'), createStartScript(), true)
  writeFile(joinPath(networkPath, 'stop.sh'), 'kubectl delete -f out -f out/deployments', true)
  writeFile(joinPath(networkPath, 'getEndpoints.sh'), createEndpointScript(config), true)
  info('Done')
}

function createStartScript() {
  return `
# check minikube is running
minikube ip > /dev/null 2>&1
EXIT_CODE=$?

if [[ EXIT_CODE -ne 0 ]];
then
  printf "Error: minikube is not running, please install and start before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

# check kubectl is installed
kubectl version > /dev/null 2>&1
EXIT_CODE=$?

if [[ EXIT_CODE -ne 0 ]];
then
  printf "Error: kubectl is not running, please install kubectl before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

kubectl apply -f out -f out/deployments
echo "\nRun 'kubectl get pods' to check status of pods\n"
`
}

function createEndpointScript(config) {
  return `
#!/bin/bash
NUMBER_OF_NODES=${config.nodes.length}
case "$1" in ("" | *[!0-9]*)
  echo 'Please provide the number of the node to get endpoints for (i.e. ./getEndpoints.sh 2)' >&2
  exit 1
esac

if [ "$1" -lt 1 ] || [ "$1" -gt $NUMBER_OF_NODES ]; then
  echo "$1 is not a valid node number. Must be between 1 and $NUMBER_OF_NODES." >&2
  exit 1
fi

IP_ADDRESS=$(minikube ip)

QUORUM_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="rpc-listener")]}{.nodePort}')

TESSERA_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="tm-tessera-third-part")]}{.nodePort}')

echo quorum rpc: http://$IP_ADDRESS:$QUORUM_PORT
echo tessera 3rd party: http://$IP_ADDRESS:$TESSERA_PORT
`
}
