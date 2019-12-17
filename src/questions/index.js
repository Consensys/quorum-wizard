import { createQuickstartConfig, createCustomConfig } from '../model/NetworkConfig'
import { createNetwork } from '../utils/networkCreator'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  NUMBER_NODES
} from './questions'

import inquirer from 'inquirer'

export async function quickstart () {
  const { numberNodes, consensus, deployment } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    DEPLOYMENT_TYPE
  ])
  const config = createQuickstartConfig(numberNodes, consensus, deployment)

  createNetwork(config)
}

export async function customize () {
  const { numberNodes, consensus, deployment } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    DEPLOYMENT_TYPE
  ])
  const config = createCustomConfig(numberNodes, consensus, deployment)

  createNetwork(config)
}
