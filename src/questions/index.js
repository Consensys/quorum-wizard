/* eslint-disable no-param-reassign */
import inquirer from 'inquirer'
import {
  isBash,
  isTessera,
  isRaft,
  isCakeshop,
  isDocker,
  isSplunk,
  getContainerPorts,
} from '../model/NetworkConfig'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
  getCustomizedCakeshopPort,
  getCustomizedSplunkPort,
} from './customPromptHelper'
import {
  getPrefilledAnswersForMode,
  NETWORK_CONFIRM,
  NETWORK_NAME,
  QUESTIONS,
} from './questions'
import { getFullNetworkPath } from '../generators/networkCreator'
import { exists } from '../utils/fileUtils'

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

  if (answers.tools.includes('splunk')) {
    answers.splunkPort = await getCustomizedSplunkPort()
  }
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

function networkExists(networkName) {
  return exists(getFullNetworkPath({ network: { name: networkName } }))
}
