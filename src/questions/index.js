import {
  createQuickstartConfig,
  createReplica7NodesConfig,
  createCustomConfig,
  generateNodeConfigs,
  isTessera,
  isDocker,
  isBash
} from '../model/NetworkConfig'
import { buildBash } from '../generators/bashHelper'
import { createDockerCompose } from '../generators/dockerHelper'
import { getCustomizedBashNodes, getCustomizedDockerPorts } from './promptHelper'
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
import { cwd, readFileToString } from '../utils/fileUtils'
import { join } from "path"
import { createDirectory } from '../generators/networkCreator'
import { generateAndCopyExampleScripts } from '../generators/examplesHelper'

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

  let nodes = (customAnswers.customizePorts && isBash(commonAnswers.deployment)) ?
    await getCustomizedBashNodes(commonAnswers.numberNodes, commonAnswers.transactionManager !== 'none') : []

  let dockerCustom = (customAnswers.customizePorts && isDocker(commonAnswers.deployment)) ?
    await getCustomizedDockerPorts(isTessera(commonAnswers.transactionManager)) : undefined

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
  console.log('')
  createDirectory(config)
  if (isBash(deployment)) {
    await buildBash(config)
  } else if (isDocker(deployment)) {
    await createDockerCompose(config)
  }
  console.log('Done')

  console.log('')
  const qdata = join(cwd(), 'network', config.network.name, 'qdata')
  const networkFolder = isBash(deployment) ? join(cwd(), 'network', config.network.name) : qdata
  let pubKey = ''
  if(isTessera(config)) {
    console.log('--------------------------------------------------------------------------------')
    console.log('')
    config.nodes.forEach((node, i) => {
      const nodeNumber = i + 1
      console.log(`Tessera Node ${nodeNumber} public key:`)
      pubKey = readFileToString(join(qdata, `c${nodeNumber}`, 'tm.pub'))
      console.log(`${pubKey}`)
      console.log('')
    })
    console.log('--------------------------------------------------------------------------------')
  }
  generateAndCopyExampleScripts(pubKey, networkFolder)
  console.log('')
  console.log('Quorum network created. Run the following commands to start your network:')
  console.log('')
  console.log(`cd network/${config.network.name}`)
  console.log('./start.sh')
  console.log('')
  console.log('A sample private and public simpleStorage contract are provided to deploy to your network')
  const tesseraMsg = isTessera(config) ? `The private contract has privateFor set as ${pubKey}\n` : ''
  console.log(tesseraMsg)
  const exampleMsg = isDocker(deployment) ?
    `To use attach to one of your quorum nodes and run loadScript('/examples/private-contract.js')` :
    `To use run ./runscript.sh private-contract.js from the network folder`
  console.log(exampleMsg)
  console.log('')
}
