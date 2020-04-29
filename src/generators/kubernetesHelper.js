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
  const startCommands = `
kubectl version > /dev/null
EXIT_CODE=$?

if [[ EXIT_CODE -ne 0 ]];
then
  printf "Error: kubectl is not running, please install kubectl before running this script.\n"
  printf "For more information, see our qubernetes project: https://github.com/jpmorganchase/qubernetes"
  exit $EXIT_CODE
fi

kubectl apply -f out -f out/deployments
echo "\nRun 'kubectl get pods' to check status of pods\n"
`

  writeFile(joinPath(networkPath, 'start.sh'), startCommands, true)
  writeFile(joinPath(networkPath, 'stop.sh'), 'kubectl delete -f out -f out/deployments', true)
  info('Done')
}
