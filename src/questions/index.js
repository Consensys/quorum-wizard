import { createQuickstartConfig, createReplica7NodesConfig, createCustomConfig, generateNodeConfigs } from '../model/NetworkConfig'
import { buildBash } from '../utils/bashHelper'
import { createDockerCompose } from '../utils/dockerHelper'
import { getCustomizedBashNodes, getCustomizedDockerPorts } from '../utils/promptHelper'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  NUMBER_NODES,
  TRANSACTION_MANAGER,
  CAKESHOP,
  QUORUM_VERSION,
  KEY_GENERATION,
  NETWORK_ID,
  GENESIS_LOCATION,
  CUSTOMIZE_PORTS
} from './questions'

import inquirer from 'inquirer'

export async function quickstart() {
  const config = createQuickstartConfig()
  await buildNetwork(config, 'bash')
}

export async function replica7Nodes () {
  const answers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP
  ])
  const config = createReplica7NodesConfig(answers)
  await buildNetwork(config, answers.deployment)
}

export async function customize () {
  const commonAnswers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP
  ])

  const customAnswers = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    // GENESIS_LOCATION,
    CUSTOMIZE_PORTS
  ])

  let nodes = (customAnswers.customizePorts && commonAnswers.deployment === 'bash') ?
    await getCustomizedBashNodes(commonAnswers.numberNodes, commonAnswers.transactionManager !== 'none') : []

  let dockerCustom = (customAnswers.customizePorts && commonAnswers.deployment === 'docker-compose') ?
    await getCustomizedDockerPorts(commonAnswers.transactionManager === 'tessera') : undefined

    const answers = {
      ...commonAnswers,
      ...customAnswers,
      nodes,
      dockerCustom
    }
  const config = createCustomConfig(answers)

  await buildNetwork(config, answers.deployment)
}

async function buildNetwork(config, deployment) {
  if (deployment === 'bash') {
    await buildBash(config)
  } else if (deployment === 'docker-compose') {
    await createDockerCompose(config)
  }
  console.log(`Quorum network details created. cd network/${config.network.name} and run start.sh to bring up your network`)
}
