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
kind create cluster --name ${config.network.name}-qube
kubectl apply -f out -f out/deployments
`

  writeFile(joinPath(networkPath, 'start.sh'), startCommands, true)
  writeFile(joinPath(networkPath, 'stop.sh'), `kind delete cluster --name ${config.network.name}-qube`, true)
  info('Done')
}
