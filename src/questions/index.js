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
  GETH_BINARY,
  KEY_GENERATION,
  NETWORK_ID,
  GENESIS_LOCATION,
  DEFAULT_PORTS
} from './questions'

import inquirer from 'inquirer'

export async function quickstart () {
  const answers = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    GETH_BINARY,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])
  const config = createQuickstartConfig(answers)
  await buildNetwork(config, answers.deployment)
}

export async function customize () {
  const commonAnswers = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    GETH_BINARY,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])

  const customAnswers = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    GENESIS_LOCATION,
    DEFAULT_PORTS
  ])

  let nodes = !commonAnswers.defaultPorts ? await getPorts(commonAnswers.numberNodes, commonAnswers.deployment, commonAnswers.transactionManager !== 'none') : []

  const answers = {
    ...commonAnswers,
    ...customAnswers,
    nodes
  }
  const config = createCustomConfig(answers)
  await buildNetwork(config, answers.deployment)
}

async function buildNetwork(config, deployment) {
  if (deployment === 'bash') {
    await buildBash(config)
  } else if (deployment === 'docker-compose') {
    createDockerCompose(config)
  }
}
