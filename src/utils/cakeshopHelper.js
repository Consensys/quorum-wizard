import { join } from 'path'
import {
  copyFile,
  createFolder
} from './fileUtils'

export function buildCakeshopDir(config, qdata) {
  const configPath = join(process.cwd(), config.network.configDir)
  const cakeshopFolder = join(configPath, 'cakeshop')
  let cakeshopDir = join(qdata, 'cakeshop')
  createFolder(cakeshopDir)
  if(config.network.deployment === 'docker-compose') {
    copyFile(join(cakeshopFolder, 'cakeshop-docker.json'), join(cakeshopDir, 'cakeshop-docker.json'))
  } else if (config.network.deployment === 'bash') {
    cakeshopDir = join(cakeshopDir, 'local')
    createFolder(cakeshopDir)
    copyFile(join(cakeshopFolder, 'cakeshop.json'), join(cakeshopDir, 'cakeshop.json'))
  }
  copyFile(join(process.cwd(), 'lib/cakeshop_application.properties.template'), join(cakeshopDir, 'application.properties'))
}

export function generateCakeshopFiles(config, configPath) {

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
