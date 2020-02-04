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
  DEFAULT_PORTS
} from './questions'

import inquirer from 'inquirer'

export async function quickstart () {
  const { numberNodes, consensus, deployment, transactionManager, cakeshop } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])

  const config = createQuickstartConfig(numberNodes, consensus, transactionManager, deployment, cakeshop)

  buildNetwork(config, deployment)
}

export async function customize () {
  const { numberNodes, consensus, deployment, transactionManager, cakeshop } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])

  const { generateKeys, networkId, genesisLocation, defaultPorts } = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    GENESIS_LOCATION,
    DEFAULT_PORTS
  ])

  let nodes = !defaultPorts ? await getPorts(numberNodes, deployment, transactionManager === 'tessera') : []

  const config = createCustomConfig(numberNodes, consensus, transactionManager, deployment, cakeshop,
    generateKeys, networkId, genesisLocation, defaultPorts, nodes)
  buildNetwork(config, deployment)
}

function buildNetwork(config, deployment) {
  if (deployment === 'bash') {
    buildBash(config)
  } else if (deployment === 'docker-compose') {
    createDockerCompose(config)
  }
}
