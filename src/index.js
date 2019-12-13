import 'source-map-support/register'
import inquirer from 'inquirer'

import { createQuickstartConfig } from './model/NetworkConfig'
import { createNetwork } from './utils/networkCreator'
import {
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE,
  INITIAL_MODE,
  NUMBER_NODES
} from './questions'

async function quickstart () {
  const { numberNodes, consensus, deployment } = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    DEPLOYMENT_TYPE
  ])
  const config = createQuickstartConfig(numberNodes, consensus, deployment)

  createNetwork(config)
}

inquirer.prompt([INITIAL_MODE])
.then(async ({ mode }) => {
  if (mode === 1) {
    await quickstart()
  } else {
    console.log('Exiting...')
  }
})
