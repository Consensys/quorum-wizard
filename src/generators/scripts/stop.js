import { addScriptExtension, scriptHeader } from './utils'

export default {
  filename: addScriptExtension('stop'),
  executable: true,
  generate: (config) => {
    switch (config.network.deployment) {
      case 'bash':
        return stopScriptBash(config)
      case 'docker-compose':
        return stopScriptDocker(config)
      case 'kubernetes':
        return stopScriptKubernetes()
      default:
        return ''
    }
  },
}

export function stopScriptBash() {
  return `#!/bin/bash
killall -INT geth
killall -INT quorum-report
killall constellation-node

if [ "\`ps -ef | grep tessera-app.jar | grep -v grep\`" != "" ]
then
    ps -ef | grep tessera-app.jar | grep -v grep | awk '{print $2}' | xargs kill
else
    echo "tessera: no process found"
fi

if [ "\`ps -ef | grep cakeshop.war | grep -v grep\`" != "" ]
then
    ps -ef | grep cakeshop.war | grep -v grep | awk '{print $2}' | xargs kill
else
    echo "cakeshop: no process found"
fi
`
}

export function stopScriptDocker(config) {
  const stopSplunk = config.network.splunk ? 'docker-compose -f docker-compose-splunk.yml down' : ''
  return `${scriptHeader()}
${stopSplunk}
docker-compose down`
}

function stopScriptKubernetes() {
  return `${scriptHeader()}
kubectl delete -f out -f out/deployments`
}
