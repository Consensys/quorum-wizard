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
    CONSENSUS_MODE,
    NUMBER_NODES,
    TRANSACTION_MANAGER,
    DEPLOYMENT_TYPE,
    CAKESHOP
  ])
  const config = createQuickstartConfig(answers)
  buildNetwork(config, answers.deployment)
}

export async function customize () {
  const commonAnswers = await inquirer.prompt([
    CONSENSUS_MODE,
    NUMBER_NODES,
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

  let nodes = (customAnswers.customizePorts && commonAnswers.deployment === 'bash') ?
    await getCustomizedBashNodes(commonAnswers.numberNodes, commonAnswers.transactionManager === 'tessera') : []

  let dockerCustom = (customAnswers.customizePorts && commonAnswers.deployment === 'docker-compose') ?
    await getCustomizedDockerPorts(commonAnswers.transactionManager === 'tessera') : undefined

    const answers = {
      ...commonAnswers,
      ...customAnswers,
      nodes,
      dockerCustom
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
  console.log(`Quorum network details created. cd network/${config.network.name} and run start.sh to bring up your network`)
}
