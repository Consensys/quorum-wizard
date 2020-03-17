import { join } from 'path'
import {
  createFolder,
  libRootDir,
  writeJsonFile,
  readFileToString,
  formatNewLine,
  writeFile,
} from '../utils/fileUtils'
import { generateCakeshopConfig } from '../model/CakeshopConfig'
import { isCakeshop } from '../model/NetworkConfig'

export function buildCakeshopDir(config, qdata) {
  const cakeshopDir = join(qdata, 'cakeshop', 'local')
  createFolder(cakeshopDir, true)
  writeJsonFile(cakeshopDir, 'cakeshop.json', generateCakeshopConfig(config))
  writeFile(join(cakeshopDir, 'application.properties'), buildPropertiesFile(config), false)
}

function buildPropertiesFile(config) {
  const properties = readFileToString(join(
    libRootDir(),
    'lib',
    'cakeshop_application.properties.template',
  ))
  return [
    formatNewLine(properties),
    `server.port=${config.network.cakeshopPort}`,
  ].join('')
}

export function generateCakeshopScript(config) {
  if (!isCakeshop(config.network.cakeshop)) {
    return ''
  }
  const jvmParams = '-Dcakeshop.config.dir=qdata/cakeshop -Dlogging.path=qdata/logs/cakeshop'
  const startCommand = `java ${jvmParams} -jar $BIN_CAKESHOP > /dev/null 2>&1 &`
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

  echo "Cakeshop started at http://localhost:${cakeshopPort}"
  `
}
