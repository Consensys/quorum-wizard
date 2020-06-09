import {
  getVersionsBintray,
  getLatestVersionGithub,
} from './download'
import { isBash } from '../model/NetworkConfig'
import { executeSync } from '../utils/execUtils'

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

  if (isBash(deployment)) {
    latestChoice = latestChoice.concat(getGethOnPath())
  }
  latestChoice = latestChoice.concat('select older versions')
  // choices = choices.map((choice) => ({ ...choice, disabled: false }))
  latestChoice = latestChoice.map((choice) => ({
    name: `Quorum ${choice}`,
    value: choice,
    disabled: false,
  }))
  return latestChoice
}

export async function getAllGethChoices(deployment) {
  let choices = await getVersionsBintray('quorum/geth')
  if (isBash(deployment)) {
    choices = choices.concat(getGethOnPath())
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
