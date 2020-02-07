import { join } from 'path'
import {
  copyFile,
  createFolder,
  cwd,
  writeJsonFile,
} from '../utils/fileUtils'
import { generateCakeshopConfig } from '../model/CakeshopConfig'

export function buildCakeshopDir(config, qdata) {
  const cakeshopDir = join(qdata, 'cakeshop', 'local')
  createFolder(cakeshopDir, true)
  writeJsonFile(cakeshopDir, 'cakeshop.json', generateCakeshopConfig(config))
  copyFile(join(cwd(), 'lib/cakeshop_application.properties.template'), join(cakeshopDir, 'application.properties'))
}

export function generateCakeshopScript(qdata) {
  const jvmParams = "-Dcakeshop.config.dir=qdata/cakeshop -Dlogging.path=qdata/logs/cakeshop"
  const CMD = `java ${jvmParams} -jar $BIN_CAKESHOP > /dev/null 2>&1 &`
  return CMD
}

export function waitForCakeshopCommand(config) {
  return `
  DOWN=true
  k=10
  while \${DOWN}; do
    sleep 1
    echo "Waiting until Cakeshop is running..."
    DOWN=false
    set +e
    result=$(curl -s http://localhost:8999/actuator/health)
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

  echo "Cakeshop started at http://localhost:8999"
  exit 0
  `
}
