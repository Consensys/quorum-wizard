import { addScriptExtension, scriptHeader, validateNodeNumberInput } from './utils'
import { isWin32 } from '../../utils/execUtils'
import { isKubernetes } from '../../model/NetworkConfig'

export default {
  filename: addScriptExtension('getEndpoints'),
  executable: true,
  generate: (config) => {
    if (!isKubernetes(config.network.deployment)) {
      throw new Error('getEndpoints script only used for Kubernetes deployments')
    }
    return endpointScriptKubernetes(config)
  },
}

export function endpointScriptKubernetes(config) {
  return isWin32() ? endpointScriptKubernetesWindows(config) : endpointScriptKubernetesBash(config)
}

function endpointScriptKubernetesBash(config) {
  return `${scriptHeader()}
${validateNodeNumberInput(config)}

minikube ip > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  IP_ADDRESS=localhost
else
  IP_ADDRESS=$(minikube ip)
fi


QUORUM_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="rpc-listener")]}{.nodePort}')

TESSERA_PORT=$(kubectl get service quorum-node$1 -o=jsonpath='{range.spec.ports[?(@.name=="tm-tessera-third-part")]}{.nodePort}')

echo quorum rpc: http://$IP_ADDRESS:$QUORUM_PORT
echo tessera 3rd party: http://$IP_ADDRESS:$TESSERA_PORT

kubectl get service cakeshop-service > /dev/null 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ];
then
  CAKESHOP_PORT=$(kubectl get service cakeshop-service -o=jsonpath='{range.spec.ports[?(@.name=="http")]}{.nodePort}')
  echo cakeshop: http://$IP_ADDRESS:$CAKESHOP_PORT
fi

kubectl get service quorum-monitor > /dev/null 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ];
then
  PROMETHEUS_PORT=$(kubectl get service quorum-monitor -o=jsonpath='{range.spec.ports[?(@.name=="prometheus")]}{.nodePort}')
  echo prometheus: http://$IP_ADDRESS:$PROMETHEUS_PORT
fi
`
}

function endpointScriptKubernetesWindows(config) {
  return `${scriptHeader()}
${validateNodeNumberInput(config)}

minikube ip >nul 2>&1
if ERRORLEVEL 1 (
  FOR /f "delims=" %%g IN ('minikube ip') DO set IP_ADDRESS=%%g
) else (
  set IP_ADDRESS=localhost
)

FOR /f "delims=" %%g IN ('minikube ip 2^>nul ^|^| echo localhost') DO set IP_ADDRESS=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%NODE_NUMBER% -o^=jsonpath^="{range.spec.ports[?(@.name=='rpc-listener')]}{.nodePort}"\`) DO set QUORUM_PORT=%%g

FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-node%NODE_NUMBER% -o^=jsonpath^="{range.spec.ports[?(@.name=='tm-tessera-third-part')]}{.nodePort}"\`) DO set TESSERA_PORT=%%g

echo quorum rpc: http://%IP_ADDRESS%:%QUORUM_PORT%
echo tessera 3rd party: http://%IP_ADDRESS%:%TESSERA_PORT%

kubectl get service cakeshop-service >nul 2>&1
if ERRORLEVEL 1 (
  FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service cakeshop-service -o^=jsonpath^="{range.spec.ports[?(@.name=='http')]}{.nodePort}"\`) DO set CAKESHOP_PORT=%%g
  echo cakeshop: http://%IP_ADDRESS%:%CAKESHOP_PORT%
)

kubectl get service quorum-monitor >nul 2>&1
if ERRORLEVEL 1 (
  FOR /F "tokens=* USEBACKQ" %%g IN (\`kubectl get service quorum-monitor -o^=jsonpath^="{range.spec.ports[?(@.name=='prometheus')]}{.nodePort}"\`) DO set PROMETHEUS_PORT=%%g
  echo prometheus: http://%IP_ADDRESS%:%PROMETHEUS_PORT%
)`
}
