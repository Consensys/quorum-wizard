import { createQuickstartConfig, createCustomConfig } from '../model/NetworkConfig'
import { createNetwork } from '../utils/networkCreator'
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

  await createNetwork(config)
}

export async function customize () {
  const { numberNodes, consensus, deployment, transactionManager } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE
  ])
  const config = createCustomConfig(numberNodes, consensus, transactionManager, deployment)

  createNetwork(config)
}
