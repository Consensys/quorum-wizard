import {
  getVersionsBintray,
  getLatestVersionGithub,
  getVersionsMaven,
} from './download'
import {
  isBash,
  isKubernetes,
} from '../model/NetworkConfig'
import {
  executeSync,
  isJava11Plus,
} from '../utils/execUtils'

const compareVersions = require('compare-versions')

export async function getLatestCakeshop() {
  let latest = await getLatestVersionGithub('cakeshop')
  latest = latest.substring(1)
  return {
    name: `Cakeshop ${latest}`,
    value: latest,
    disabled: false,
  }
}

export async function getDownloadableGethChoices(deployment) {
  const choices = await getVersionsBintray('quorum/geth')
  let latestChoice = [choices[0]]
  latestChoice = latestChoice.map((choice) => ({
    name: `Quorum ${choice}`,
    value: choice,
    disabled: false,
  }))
  if (isBash(deployment)) {
    latestChoice = latestChoice.concat(getGethOnPath())
  }
  latestChoice = latestChoice.concat('select older versions')
  return latestChoice
}

export async function getAllGethChoices() {
  let choices = await getVersionsBintray('quorum/geth')
  choices = choices.map((choice) => ({
    name: `Quorum ${choice}`,
    value: choice,
    disabled: false,
  }))
  return choices
}

export function getGethOnPath() {
  const pathChoices = []
  try {
    const gethOnPath = executeSync('which geth').toString().trim()
    if (gethOnPath) {
      const gethVersionOutput = executeSync('geth version').toString()
      const versionMatch = gethVersionOutput.match(/Quorum Version: (\S+)/)
      if (versionMatch !== null) {
        const version = versionMatch[1]
        pathChoices.push({
          name: `Quorum ${version} on path (${gethOnPath})`,
          value: 'PATH',
        })
      }
    }
  } catch (e) {
    // either no geth or the version call errored, don't include it in choices
  }
  return pathChoices
}

export async function getDownloadableTesseraChoices(deployment) {
  const choices = await getVersionsMaven('tessera-app')
  let latestChoice = [choices[0]]

  latestChoice = latestChoice.map((choice) => ({
    name: `Tessera ${choice}`,
    value: choice,
    disabled: disableTesseraIfWrongJavaVersion(choice),
  }))

  if (isBash(deployment)) {
    latestChoice = latestChoice.concat(getTesseraOnPath())
  }
  latestChoice = latestChoice.concat('select older versions')
  latestChoice = isKubernetes(deployment) ? latestChoice : latestChoice.concat('none')
  return latestChoice
}

export async function getAllTesseraChoices(deployment) {
  let choices = await getVersionsMaven('tessera-app')
  choices = choices.map((choice) => ({
    name: `Tessera ${choice}`,
    value: choice,
    disabled: disableTesseraIfWrongJavaVersion(choice),
  }))
  if (isBash(deployment)) {
    choices = choices.concat(getTesseraOnPath())
  }
  choices = isKubernetes(deployment) ? choices : choices.concat('none')
  return choices
}

export function getTesseraOnPath() {
  const pathChoices = []
  const tesseraJarEnv = process.env.TESSERA_JAR
  if (tesseraJarEnv) {
    pathChoices.push({
      name: `Tessera at $TESSERA_JAR (${tesseraJarEnv})`,
      value: 'PATH',
    })
  }
  return pathChoices
}

export function disableTesseraIfWrongJavaVersion(version) {
  // if version is less than 10.3.0, use java8
  const needJava8 = compareVersions.compare('0.10.3', version, '>')
  if (needJava8 && isJava11Plus()) {
    return 'Disabled, requires Java 8'
  }
  if (!needJava8 && !isJava11Plus()) {
    return 'Disabled, requires Java 11+'
  }
  return false
}
