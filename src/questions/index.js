import { createQuickstartConfig, createCustomConfig } from '../model/NetworkConfig'
import { buildBash } from '../utils/bashHelper'
import { createDockerCompose } from '../utils/dockerHelper'
import { getPorts } from '../utils/promptHelper'
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

  const portPrompt = customAnswers.customizePorts  && (commonAnswers.deployment === 'bash')
  let nodes = portPrompt ? await getPorts(commonAnswers.numberNodes, commonAnswers.deployment, commonAnswers.transactionManager === 'tessera') : []

  const answers = {
    ...commonAnswers,
    ...customAnswers,
    customizePorts: portPrompt,
    nodes
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
