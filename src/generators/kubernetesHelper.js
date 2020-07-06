import { writeFile } from '../utils/fileUtils'
import { getFullNetworkPath } from './networkCreator'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import { isWin32 } from '../utils/execUtils'
import { scriptHeader, validateNodeNumberInput } from './bashHelper'

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
  return `${scriptHeader()}

# check kubectl is installed
kubectl > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Error: kubectl not found, please install kubectl before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

kubectl cluster-info >nul 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Could not connect to a kubernetes cluster. Please make sure you have minikube or another local kubernetes cluster running.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

kubectl apply -f out -f out/deployments
echo "\nRun 'kubectl get pods' to check status of pods\n"
`
}

function createStartScriptWindows() {
  return `${scriptHeader()}
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
  return `${scriptHeader()}
kubectl delete -f out -f out/deployments`
}

function createStopScriptWindows() {
  return 'kubectl delete -f out -f out/deployments'
}

function createEndpointScript(config) {
  return `${scriptHeader()}
${validateNodeNumberInput(config)}

IP_ADDRESS=$(minikube ip 2>/dev/null || echo localhost)

QUORUM_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="rpc-listener")]}{.nodePort}')

TESSERA_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="tm-tessera-third-part")]}{.nodePort}')

echo quorum rpc: http://$IP_ADDRESS:$QUORUM_PORT
echo tessera 3rd party: http://$IP_ADDRESS:$TESSERA_PORT
`
}

function createEndpointScriptWindows(config) {
  return `${scriptHeader()}
${validateNodeNumberInput(config)}

FOR /f "delims=" %%g IN ('minikube ip ^|^| echo localhost') DO set IP_ADDRESS=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%input% -o^=jsonpath^="{range.spec.ports[?(@.name=='rpc-listener')]}{.nodePort}"\`) DO set QUORUM_PORT=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%input% -o^=jsonpath^="{range.spec.ports[?(@.name=='tm-tessera-third-part')]}{.nodePort}"\`) DO set TESSERA_PORT=%%g

echo quorum rpc: http://%IP_ADDRESS%:%QUORUM_PORT%
echo tessera 3rd party: http://%IP_ADDRESS%:%TESSERA_PORT%`
}

export function kubernetesAttachCommand() {
  if (isWin32()) {
    return `
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /geth-helpers/geth-attach.sh`
  }
  return `POD=$(kubectl get pod --field-selector=status.phase=Running -o name | grep quorum-node$NODE_NUMBER)
kubectl $NAMESPACE exec -it $POD -c quorum -- /geth-helpers/geth-attach.sh`
}

export function kubernetesRunscriptCommand() {
  if (isWin32()) {
    return `
SET NODE_NUMBER=1
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/%1
    `
  }
  return `
NODE_NUMBER=1
POD=$(kubectl get pod --field-selector=status.phase=Running -o name | grep quorum-node$NODE_NUMBER)
kubectl $NAMESPACE exec -it $POD -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/$1`
}
