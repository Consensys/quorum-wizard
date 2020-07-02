import {
  writeFile,
} from '../utils/fileUtils'
import {
  getFullNetworkPath,
} from './networkCreator'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import { isWin32 } from '../utils/execUtils'

// eslint-disable-next-line import/prefer-default-export
export async function createKubernetes(config) {
  const networkPath = getFullNetworkPath(config)

  info('Writing start script...')

  if (isWin32()) {
    writeFile(joinPath(networkPath, 'start.cmd'), createStartScriptWindows(), true)
    writeFile(joinPath(networkPath, 'stop.cmd'), createStopScriptWindows(), true)
    writeFile(joinPath(networkPath, 'getEndpoints.cmd'), createEndpointScriptWindows(config), true)
  } else {
    writeFile(joinPath(networkPath, 'start.sh'), createStartScript(), true)
    writeFile(joinPath(networkPath, 'stop.sh'), createStopScript(), true)
    writeFile(joinPath(networkPath, 'getEndpoints.sh'), createEndpointScript(config), true)
  }
  info('Done')
}

function createStartScript() {
  return `#!/bin/bash
# check minikube is running
minikube ip > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Error: minikube is not running, please install and start before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

# check kubectl is installed
kubectl version > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Error: kubectl is not running, please install kubectl before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

kubectl apply -f out -f out/deployments
echo "\nRun 'kubectl get pods' to check status of pods\n"
`
}

function createStartScriptWindows() {
  return `@ECHO OFF
kubectl >nul 2>&1
if ERRORLEVEL 1 (
  echo kubectl not found on your machine. Please make sure you have Kubernetes installed && EXIT /B 1
)

kubectl cluster-info >nul 2>&1
if ERRORLEVEL 1 (
  echo Could not connect to a kubernetes cluster. Please make sure you have minikube or another local kubernetes cluster running. && EXIT /B 1
)

kubectl apply -f out -f out/deployments
echo Run 'kubectl get pods' to check status of pods`
}

function createStopScript() {
  return `#!/bin/bash
kubectl delete -f out -f out/deployments`
}

function createStopScriptWindows() {
  return 'kubectl delete -f out -f out/deployments'
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

function createEndpointScriptWindows(config) {
  return `@ECHO OFF
SETLOCAL
SET NUMBER_OF_NODES=${config.nodes.length}
SET /A input=%1

if "%1"=="" (
    echo Please provide the number of the node to attach to (i.e. ./attach.sh 2) && EXIT /B 1
)

if %input% EQU 0 (
    echo Please provide the number of the node to attach to (i.e. ./attach.sh 2) && EXIT /B 1
)

if %input% GEQ %NUMBER_OF_NODES%+1 (
    echo %1 is not a valid node number. Must be between 1 and %NUMBER_OF_NODES%. && EXIT /B 1
)

FOR /f "delims=" %%g IN ('minikube ip ^|^| echo localhost') DO set IP_ADDRESS=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%input% -o^=jsonpath^="{range.spec.ports[?(@.name=='rpc-listener')]}{.nodePort}"\`) DO set QUORUM_PORT=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%input% -o^=jsonpath^="{range.spec.ports[?(@.name=='tm-tessera-third-part')]}{.nodePort}"\`) DO set TESSERA_PORT=%%g

echo quorum rpc: http://%IP_ADDRESS%:%QUORUM_PORT%
echo tessera 3rd party: http://%IP_ADDRESS%:%TESSERA_PORT%`
}
