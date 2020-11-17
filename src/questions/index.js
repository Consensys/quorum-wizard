/* eslint-disable no-param-reassign */
import inquirer from 'inquirer'
import {
  isBash,
  isTessera,
  isRaft,
  isDocker,
  getContainerPorts,
  CUSTOM_CONFIG_LOCATION,
} from '../model/NetworkConfig'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
  getCustomizedCakeshopPort,
  getCustomizedSplunkPort,
  getCustomizedReportingPorts,
} from './customPromptHelper'
import {
  getPrefilledAnswersForMode,
  NETWORK_CONFIRM,
  NETWORK_NAME,
  QUESTIONS,
  GENERATE_QUESTIONS,
  GENERATE_NAME,
} from './questions'
import {
  getConfigsPath,
} from '../generators/networkCreator'
import { exists } from '../utils/fileUtils'
import { getFullNetworkPath } from '../generators/networkHelper'

// eslint-disable-next-line import/prefer-default-export
export async function promptUser(mode) {
  const answers = await inquirer.prompt(QUESTIONS, getPrefilledAnswersForMode(mode))

  answers.containerPorts = !isBash(answers.deployment) ? getContainerPorts(answers.deployment) : {}

  if (answers.customizePorts) {
    await promptForCustomPorts(answers)
  }

  await confirmNetworkName(answers)

  return answers
}

async function promptForCustomPorts(answers) {
  if (isBash(answers.deployment)) {
    answers.nodes = await getCustomizedBashNodes(
      answers.numberNodes,
      isTessera(answers.transactionManager),
      isRaft(answers.consensus),
    )
  } else if (isDocker(answers.deployment)) {
    answers.nodes = await getCustomizedDockerPorts(
      answers.numberNodes,
      isTessera(answers.transactionManager),
      answers.containerPorts.dockerSubnet,
    )
  }

  if (answers.tools.includes('cakeshop')) {
    answers.cakeshopPort = await getCustomizedCakeshopPort()
  }

  if (answers.tools.includes('reporting')) {
    const { reportingRpcPort, reportingUiPort } = await getCustomizedReportingPorts()
    answers.reportingRpcPort = reportingRpcPort
    answers.reportingUiPort = reportingUiPort
  }

  if (answers.tools.includes('splunk')) {
    const { splunkPort, splunkHecPort } = await getCustomizedSplunkPort()
    answers.splunkPort = splunkPort
    answers.splunkHecPort = splunkHecPort
  }
}

export async function promptGenerate() {
  const answers = await inquirer.prompt(GENERATE_QUESTIONS)

  if (answers.name) {
    await confirmGenerateNetworkName(answers)
  }
  if (answers.generate !== CUSTOM_CONFIG_LOCATION) {
    answers.configLocation = getConfigsPath(answers.generate)
  }

  return answers
}

async function confirmNetworkName(answers) {
  let overwrite = false
  while (networkExists(answers.name) && !overwrite) {
    overwrite = (await inquirer.prompt([NETWORK_CONFIRM], answers)).overwrite
    if (overwrite === false) {
      delete answers.name
      answers.name = (await inquirer.prompt([NETWORK_NAME], answers)).name
    }
  }
}

async function confirmGenerateNetworkName(answers) {
  let overwrite = false
  while (networkExists(answers.name) && !overwrite) {
    overwrite = (await inquirer.prompt([NETWORK_CONFIRM], answers)).overwrite
    if (overwrite === false) {
      delete answers.name
      answers.name = (await inquirer.prompt([GENERATE_NAME], answers)).name
    }
  }
}

function networkExists(networkName) {
  return exists(getFullNetworkPath({ network: { name: networkName } }))
}
