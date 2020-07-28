import { startScriptBash } from '../bashHelper'
import { libRootDir, readFileToString } from '../../utils/fileUtils'
import { joinPath } from '../../utils/pathUtils'
import { addScriptExtension, scriptHeader } from './utils'
import { isWin32 } from '../../utils/execUtils'

export default {
  filename: addScriptExtension('start'),
  executable: true,
  generate: (config) => {
    switch (config.network.deployment) {
      case 'bash':
        return startScriptBash(config)
      case 'docker-compose':
        return startScriptDocker(config)
      case 'kubernetes':
        return isWin32() ? startScriptKubernetesWindows() : startScriptKubernetesBash()
      default:
        return ''
    }
  },
}

function startScriptDocker(config) {
  if (config.network.txGenerate) {
    return readFileToString(joinPath(libRootDir(), 'lib', 'start-with-splunk-txns.sh'))
  }
  return `${scriptHeader()}
docker-compose up -d`
}

function startScriptKubernetesBash() {
  return `${scriptHeader()}

echo "Checking if Kubernetes is running"
kubectl > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Error: kubectl not found, please install kubectl before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

kubectl cluster-info > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ];
then
  printf "Could not connect to a kubernetes cluster. Please make sure you have minikube or another local kubernetes cluster running.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes\n"
  exit $EXIT_CODE
fi

echo "Setting up network"
kubectl apply -f out -f out/deployments
echo "\nRun 'kubectl get pods' to check status of pods\n"
`
}

function startScriptKubernetesWindows() {
  return `${scriptHeader()}
echo Checking if Kubernetes is running
kubectl >nul 2>&1
if ERRORLEVEL 1 (
  echo kubectl not found on your machine. Please make sure you have Kubernetes installed && EXIT /B 1
)

kubectl cluster-info >nul 2>&1
if ERRORLEVEL 1 (
  echo Could not connect to a kubernetes cluster. Please make sure you have minikube or another local kubernetes cluster running. && EXIT /B 1
)

echo Setting up network
kubectl apply -f out -f out/deployments
echo Run 'kubectl get pods' to check status of pods`
}
