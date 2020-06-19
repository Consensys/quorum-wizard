import cmp from 'semver-compare'
import {
  getVersionsBintray,
  getLatestVersionGithub,
  getVersionsMaven,
  getVersionsDockerHub,
  LATEST_TESSERA_J8,
  LATEST_CAKESHOP_J8,
} from './download'
import {
  isBash,
  isKubernetes,
  isDocker,
} from '../model/NetworkConfig'
import {
  executeSync,
  isJava11Plus,
} from '../utils/execUtils'

export async function getLatestCakeshop(deployment) {
  let latest
  if (isBash(deployment)) {
    latest = await getLatestVersionGithub('cakeshop')
    latest = latest.substring(1)
    latest = isJava11Plus() ? latest : LATEST_CAKESHOP_J8
  } else {
    latest = 'latest'
  }
  return {
    name: `Cakeshop ${latest}`,
    value: latest,
    disabled: false,
  }
}

export async function getGethChoices(deployment) {
  let choices
  if (isDocker(deployment)) {
    choices = await getVersionsDockerHub('quorum')
  } else {
    choices = await getVersionsBintray('quorum/geth')
    choices = choices.map((choice) => choice.substring(1))
  }
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

export async function getAllGethChoices(deployment) {
  let choices
  if (isDocker(deployment)) {
    choices = await getVersionsDockerHub('quorum')
  } else {
    choices = await getVersionsBintray('quorum/geth')
    choices = choices.map((choice) => choice.substring(1))
  }
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
      const version = getPathGethVersion()
      if (version !== null) {
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

export function getPathGethVersion() {
  const gethVersionOutput = executeSync('geth version').toString()
  const versionMatch = gethVersionOutput.match(/Quorum Version: (\S+)/)
  if (versionMatch !== null) {
    return versionMatch[1]
  }
  return null
}

export function isQuorum260Plus(quorumVersion) {
  const version = quorumVersion === 'PATH' ? getPathGethVersion() : quorumVersion
  return cmp(version, '2.6.0') >= 0
}

export async function getTesseraChoices(deployment) {
  const choices = isBash(deployment)
    ? await getVersionsMaven('tessera-app')
    : await getVersionsDockerHub('tessera')
  const availableChoices = isBash(deployment)
    ? choices.filter((choice) => !disableTesseraIfWrongJavaVersion(choice))
    : choices
  let latestChoice = [availableChoices[0]]

  latestChoice = latestChoice.map((choice) => ({
    name: `Tessera ${choice}`,
    value: choice,
    disabled: false,
  }))

  if (isBash(deployment)) {
    latestChoice = latestChoice.concat(getTesseraOnPath())
  }
  latestChoice = latestChoice.concat('select older versions')
  latestChoice = isKubernetes(deployment) ? latestChoice : latestChoice.concat('none')
  return latestChoice
}

export async function getAllTesseraChoices(deployment) {
  let choices = isBash(deployment)
    ? await getVersionsMaven('tessera-app')
    : await getVersionsDockerHub('tessera')
  choices = choices.map((choice) => ({
    name: `Tessera ${choice}`,
    value: choice,
    disabled: isBash(deployment) ? disableTesseraIfWrongJavaVersion(choice) : false,
  }))
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
  const needJava8 = cmp(LATEST_TESSERA_J8, version) >= 0
  if (needJava8 && isJava11Plus()) {
    return 'Disabled, requires Java 8'
  }
  if (!needJava8 && !isJava11Plus()) {
    return 'Disabled, requires Java 11+'
  }
  return false
}
