import {
  addScriptExtension, filenameCheck, scriptHeader, setEnvironmentCommand,
} from './utils'
import { isWin32 } from '../../utils/execUtils'

export default {
  filename: addScriptExtension('runscript'),
  executable: true,
  generate: (config) => `${scriptHeader()}
${filenameCheck()}
${runScript(config)}
`,
}

function runScript(config) {
  switch (config.network.deployment) {
    case 'bash':
      return runscriptCommandBash(config)
    case 'docker-compose':
      return isWin32() ? runScriptCommandDockerWindows() : runScriptCommandDockerBash()
    case 'kubernetes':
      return isWin32() ? runscriptCommandKubernetesWindows() : runscriptCommandKubernetesBash()
    default:
      return ''
  }
}

export function runscriptCommandBash(config) {
  return `${setEnvironmentCommand(config)}
"$BIN_GETH" --exec "loadScript(\\"$1\\")" attach qdata/dd1/geth.ipc`
}

function runScriptCommandDockerWindows() {
  return `FOR /F "tokens=* USEBACKQ" %%g IN (\`docker-compose ps -q node1\`) DO set DOCKER_CONTAINER=%%g
docker cp %1 %DOCKER_CONTAINER%:/%1
docker-compose exec node1 /bin/sh -c "geth --exec 'loadScript(\\"%1\\")' attach qdata/dd/geth.ipc"
`
}

function runScriptCommandDockerBash() {
  return `docker cp $1 "$(docker-compose ps -q node1)":/$1
docker-compose exec node1 /bin/sh -c "geth --exec 'loadScript(\\"$1\\")' attach qdata/dd/geth.ipc"
`
}

// TODO is there a way to copy the script in like we do for docker-compose runscript?
function runscriptCommandKubernetesWindows() {
  return `
SET NODE_NUMBER=1
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/%1
    `
}

function runscriptCommandKubernetesBash() {
  return `
NODE_NUMBER=1
POD=$(kubectl get pod --field-selector=status.phase=Running -o name | grep quorum-node$NODE_NUMBER)
kubectl $NAMESPACE exec -it $POD -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/$1`
}
