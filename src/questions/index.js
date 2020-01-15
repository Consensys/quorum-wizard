import { createQuickstartConfig, createCustomConfig } from '../model/NetworkConfig'
import { buildBash } from '../utils/bashHelper'
import { createDockerCompose } from '../utils/dockerHelper'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  NUMBER_NODES,
  TRANSACTION_MANAGER
} from './questions'

import inquirer from 'inquirer'

export async function quickstart () {
  const { numberNodes, consensus, deployment, transactionManager } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE
  ])
  const config = createQuickstartConfig(numberNodes, consensus, transactionManager, deployment)
  if (deployment === 'bash') {
    await buildBash(config)
  } else if (deployment === 'docker-compose') {
    await createDockerCompose(config)
  }
}

export async function customize () {
  const { numberNodes, consensus, deployment, transactionManager } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE
  ])
  const config = createCustomConfig(numberNodes, consensus, transactionManager, deployment)

  if (deployment === 'bash') {
    await buildBash(config)
  } else if (deployment === 'docker-compose') {
    await createDockerCompose(config)
  }
}
