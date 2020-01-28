import { join } from 'path'
import {
  copyFile,
  createFolder,
  cwd,
  writeJsonFile,
} from './fileUtils'
import { generateCakeshopConfig } from '../model/CakeshopConfig'

export function buildCakeshopDir(config, qdata) {
  const configPath = join(cwd(), config.network.configDir)
  const cakeshopFolder = join(configPath, 'cakeshop')
  let cakeshopDir = join(qdata, 'cakeshop')
  createFolder(cakeshopDir)
  if(config.network.configDir !== '7nodes') {
    generateCakeshopFiles(config, cakeshopFolder)
  }
  const deployment = config.network.deployment
  if (deployment === 'bash') {
    cakeshopDir = join(cakeshopDir, 'local')
    createFolder(cakeshopDir)
  }
  copyFile(join(cakeshopFolder, `cakeshop_${deployment}.json`), join(cakeshopDir, 'cakeshop.json'))
  copyFile(join(cwd(), 'lib/cakeshop_application.properties.template'), join(cakeshopDir, 'application.properties'))
}

export function generateCakeshopFiles(config, cakeshopFolder) {
  createFolder(cakeshopFolder)
  writeJsonFile(cakeshopFolder, `cakeshop_${config.network.deployment}.json`, generateCakeshopConfig(config))

}

export function generateCakeshopScript(qdata) {
  const cakeshopJar = '$CAKESHOP_JAR' // require env variable to be set for now
  const jvmParams = "-Dcakeshop.config.dir=qdata/cakeshop -Dlogging.path=qdata/logs/cakeshop"
  const CMD = `java ${jvmParams} -jar ${cakeshopJar} > /dev/null 2>&1 &`
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
