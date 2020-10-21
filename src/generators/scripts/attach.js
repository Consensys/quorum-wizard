import {
  addScriptExtension, scriptHeader, setEnvironmentCommand, validateNodeNumberInput,
} from './utils'
import { isWin32 } from '../../utils/execUtils'

export default {
  filename: addScriptExtension('attach'),
  executable: true,
  generate: (config) => `${scriptHeader()}
${validateNodeNumberInput(config)}
${attachCommand(config)}`,
}

function attachCommand(config) {
  switch (config.network.deployment) {
    case 'bash':
      return attachCommandBash(config)
    case 'docker-compose':
      return isWin32() ? attachCommandDockerWindows() : attachCommandDockerBash()
    case 'kubernetes':
      return isWin32() ? attachCommandKubernetesWindows() : attachCommandKubernetesBash()
    default:
      return ''
  }
}

export function attachCommandBash(config) {
  return `${setEnvironmentCommand(config)}
"$BIN_GETH" attach qdata/dd$1/geth.ipc`
}

function attachCommandDockerWindows() {
  return 'docker-compose exec node%NODE_NUMBER% /bin/sh -c "geth attach qdata/dd/geth.ipc"'
}

function attachCommandDockerBash() {
  return 'docker-compose exec node$NODE_NUMBER /bin/sh -c "geth attach qdata/dd/geth.ipc"'
}

function attachCommandKubernetesWindows() {
  return `
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /geth-helpers/geth-attach.sh`
}

function attachCommandKubernetesBash() {
  return `POD=$(kubectl get pod --field-selector=status.phase=Running -o name | grep quorum-node$NODE_NUMBER)
kubectl $NAMESPACE exec -it $POD -c quorum -- /geth-helpers/geth-attach.sh`
}
