import inquirer from 'inquirer'
import {
  isBash,
  isTessera,
  isRaft,
  isCakeshop,
} from '../model/NetworkConfig'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
  getCustomizedCakeshopPort,
} from './customPromptHelper'
import {
  CUSTOM_QUESTIONS,
  QUICKSTART_QUESTIONS,
  SIMPLE_QUESTIONS,
} from './questions'

// eslint-disable-next-line import/prefer-default-export
export async function promptUser(mode) {
  const answers = await inquirer.prompt(getQuestionsForMode(mode))

  if (answers.customizePorts) {
    await promptForCustomPorts(answers)
  }

  return answers
}

function getQuestionsForMode(mode) {
  switch (mode) {
    case 'simple':
      return SIMPLE_QUESTIONS
    case 'custom':
      return CUSTOM_QUESTIONS
    case 'quickstart':
    default:
      return QUICKSTART_QUESTIONS
  }
}

async function promptForCustomPorts(answers) {
  // eslint-disable-next-line no-param-reassign
  answers.nodes = isBash(answers.deployment)
    ? await getCustomizedBashNodes(
      answers.numberNodes,
      isTessera(answers.transactionManager),
      isRaft(answers.consensus),
    )
    : await getCustomizedDockerPorts(
      answers.numberNodes,
      isTessera(answers.transactionManager),
    )

  if (isCakeshop(answers.cakeshop)) {
    // eslint-disable-next-line no-param-reassign
    answers.cakeshopPort = await getCustomizedCakeshopPort()
  }
}
