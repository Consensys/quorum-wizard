import { createFolder, formatNewLine, writeFile, writeJsonFile, } from '../utils/fileUtils'
import { generateCakeshopConfig } from '../model/CakeshopConfig'
import { isCakeshop, isDocker, } from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'

export function buildCakeshopDir(config, qdata) {
  const cakeshopDir = joinPath(qdata, 'cakeshop', 'local')
  createFolder(cakeshopDir, true)
  writeJsonFile(cakeshopDir, 'cakeshop.json', generateCakeshopConfig(config))
  writeFile(joinPath(cakeshopDir, 'application.properties'), buildPropertiesFile(config), false)
}

function buildPropertiesFile(config) {
  const cakeshopConfig = {
    'cakeshop.initialnodes': 'qdata/cakeshop/local/cakeshop.json',
    'cakeshop.selected_node': '1',
    'contract.registry.addr': '',
    'server.port': config.network.cakeshopPort,
  }
  if(config.network.reporting) {
    // docker only, so use 'reporting' hostname, but localhost for the ui
    cakeshopConfig['cakeshop.reporting.rpc'] = `http://reporting:${config.network.reportingRpcPort}`
    cakeshopConfig['cakeshop.reporting.ui'] = `http://localhost:${config.network.reportingUiPort}`
  }
  return Object.entries(cakeshopConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export function generateCakeshopScript(config) {
  if (!isCakeshop(config.network.cakeshop)) {
    return ''
  }
  const jvmParams = '-Dcakeshop.config.dir=qdata/cakeshop'
  const startCommand = `java ${jvmParams} -jar "$BIN_CAKESHOP" >> qdata/logs/cakeshop.log 2>&1 &`
  return [
    'echo "Starting Cakeshop"',
    startCommand,
    waitForCakeshopCommand(config.network.cakeshopPort),
  ].join('\n')
}

export function waitForCakeshopCommand(cakeshopPort) {
  return `
DOWN=true
k=10
while \${DOWN}; do
  sleep 1
  echo "Waiting until Cakeshop is running..."
  DOWN=false
  set +e
  result=$(curl -s http://localhost:${cakeshopPort}/actuator/health)
  set -e
  if [ ! "\${result}" == "{\\"status\\":\\"UP\\"}" ]; then
    echo "Cakeshop is not yet listening on http"
    DOWN=true
  fi

  k=$((k-1))
  if [ \${k} -le 0 ]; then
    echo "Cakeshop is taking a long time to start. Look at logs"
  fi

  sleep 5
done

echo "Cakeshop started at http://localhost:${cakeshopPort}"`
}
