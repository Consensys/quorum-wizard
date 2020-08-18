import { startScriptBash } from '../bashHelper'
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

function startSplunkDocker(config) {
  return `docker-compose -f docker-compose-splunk.yml up -d

  sleep 3

  echo -n 'Waiting for splunk to start.'
  until docker logs ${config.network.name}-splunk | grep -m 1 'Ansible playbook complete'
  do
    echo -n "."
    sleep 5
  done
  echo " "
  echo "Splunk started!"

  echo "Starting quorum stack..."`
}

function startScriptDocker(config) {
  const startSplunk = config.network.splunk ? startSplunkDocker(config) : ''
  return `${scriptHeader()}
${startSplunk}
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
