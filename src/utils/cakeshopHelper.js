import { join } from 'path'
import {
  copyFile,
  createFolder
} from './fileUtils'

export function buildCakeshopDir(config, qdata) {
  const configPath = join(process.cwd(), config.network.configDir)
  const cakeshopFolder = join(configPath, 'cakeshop')
  const cakeshopDir = join(qdata, 'cakeshop')
  createFolder(cakeshopDir)
  if(config.network.deployment === 'docker-compose') {
    copyFile(join(cakeshopFolder, 'cakeshop-docker.json'), join(cakeshopDir, 'cakeshop-docker.json'))
  } else if (config.network.deployment === 'bash') {
    copyFile(join(cakeshopFolder, 'cakeshop.json'), join(cakeshopDir, 'cakeshop.json'))
  }
  copyFile(join(cakeshopFolder, 'application.properties.template'), join(cakeshopDir, 'application.properties.template'))
}
