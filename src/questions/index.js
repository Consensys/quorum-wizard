import { createQuickstartConfig, createCustomConfig } from '../model/NetworkConfig'
import { createNetwork } from '../utils/networkCreator'
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
    createNetwork(config)
  } else if (deployment === 'docker-compose') {
    createDockerCompose(config)
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
    createNetwork(config)
  } else if (deployment === 'docker-compose') {
    createDockerCompose(config)
  }
}
