import { createQuickstartConfig, createCustomConfig, generateNodeConfigs } from '../model/NetworkConfig'
import { buildBash } from '../utils/bashHelper'
import { createDockerCompose } from '../utils/dockerHelper'
import { getCustomizedBashNodes, getCustomizedDockerPorts } from '../utils/promptHelper'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  NUMBER_NODES,
  TRANSACTION_MANAGER,
  CAKESHOP,
  KEY_GENERATION,
  NETWORK_ID,
  GENESIS_LOCATION,
  CUSTOMIZE_PORTS
} from './questions'

import inquirer from 'inquirer'

export async function quickstart () {
  const answers = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])
  const config = createQuickstartConfig(answers)
  buildNetwork(config, answers.deployment)
}

export async function customize () {
  const commonAnswers = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])

  const customAnswers = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    GENESIS_LOCATION,
    CUSTOMIZE_PORTS
  ])

  let nodes = ((customAnswers.customizePorts && commonAnswers.deployment === 'bash') || ommonAnswers.deployment === 'docker-compose') ?
    await getCustomizedBashNodes(commonAnswers.numberNodes, commonAnswers.transactionManager === 'tessera') : []

  let dockerConfig = (customAnswers.customizePorts && commonAnswers.deployment === 'docker-compose') ?
    await getCustomizedDockerPorts(commonAnswers.transactionManager === 'tessera') : undefined

    const answers = {
      ...commonAnswers,
      ...customAnswers,
      nodes,
      dockerConfig
    }
  const config = createCustomConfig(answers)

  buildNetwork(config, answers.deployment)
}

function buildNetwork(config, deployment) {
  if (deployment === 'bash') {
    buildBash(config)
  } else if (deployment === 'docker-compose') {
    createDockerCompose(config)
  }
}
