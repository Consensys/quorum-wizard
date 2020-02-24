import inquirer from 'inquirer'
import { join } from 'path'
import { info } from '../utils/log'
import {
  createCustomConfig,
  createQuickstartConfig,
  createReplica7NodesConfig,
  isBash,
  isDocker,
  isTessera,
} from '../model/NetworkConfig'
import { buildBash } from '../generators/bashHelper'
import { createDockerCompose } from '../generators/dockerHelper'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
} from './promptHelper'
import {
  CAKESHOP,
  CONSENSUS_MODE,
  CUSTOMIZE_PORTS,
  DEPLOYMENT_TYPE,
  KEY_GENERATION,
  NETWORK_ID,
  NUMBER_NODES,
  QUORUM_VERSION,
  TRANSACTION_MANAGER,
} from './questions'

import {
  cwd,
  readFileToString,
} from '../utils/fileUtils'
import { createDirectory } from '../generators/networkCreator'
import { generateAndCopyExampleScripts } from '../generators/examplesHelper'

export async function quickstart() {
  const config = createQuickstartConfig()
  await buildNetwork(config, 'bash')
}

export async function replica7Nodes() {
  const answers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP,
  ])
  const config = createReplica7NodesConfig(answers)
  await buildNetwork(config, answers.deployment)
}

export async function customize() {
  const commonAnswers = await inquirer.prompt([
    DEPLOYMENT_TYPE,
    CONSENSUS_MODE,
    NUMBER_NODES,
    QUORUM_VERSION,
    TRANSACTION_MANAGER,
    CAKESHOP,
  ])

  const customAnswers = await inquirer.prompt([
    KEY_GENERATION,
    NETWORK_ID,
    // GENESIS_LOCATION,
    CUSTOMIZE_PORTS,
  ])

  const nodes = (customAnswers.customizePorts && isBash(commonAnswers.deployment))
    ? await getCustomizedBashNodes(
      commonAnswers.numberNodes,
      isTessera(commonAnswers.transactionManager),
    )
    : []

  const dockerCustom = (customAnswers.customizePorts && isDocker(commonAnswers.deployment)
  )
    ? await getCustomizedDockerPorts(isTessera(commonAnswers.transactionManager)) : undefined

  const answers = {
    ...commonAnswers,
    ...customAnswers,
    nodes,
    dockerCustom,
  }
  const config = createCustomConfig(answers)

  await buildNetwork(config, answers.deployment)
}

async function buildNetwork(config, deployment) {
  info('')
  createDirectory(config)
  if (isBash(deployment)) {
    await buildBash(config)
  } else if (isDocker(deployment)) {
    await createDockerCompose(config)
  }
  info('Done')

  info('')
  const qdata = join(cwd(), 'network', config.network.name, 'qdata')
  const networkFolder = isBash(deployment) ? join(cwd(), 'network', config.network.name) : qdata
  let pubKey = ''
  if (isTessera(config.network.transactionManager)) {
    info('--------------------------------------------------------------------------------')
    info('')
    config.nodes.forEach((node, i) => {
      const nodeNumber = i + 1
      info(`Tessera Node ${nodeNumber} public key:`)
      pubKey = readFileToString(join(qdata, `c${nodeNumber}`, 'tm.pub'))
      info(`${pubKey}`)
      info('')
    })
    info('--------------------------------------------------------------------------------')
  }
  generateAndCopyExampleScripts(pubKey, networkFolder)
  info('')
  info('Quorum network created. Run the following commands to start your network:')
  info('')
  info(`cd network/${config.network.name}`)
  info('./start.sh')
  info('')
  info('A sample private and public simpleStorage contract are provided to deploy to your network')
  const tesseraMsg = isTessera(config.network.transactionManager)
    ? `The private contract has privateFor set as ${pubKey}\n`
    : ''
  info(tesseraMsg)
  const exampleMsg = isDocker(deployment)
    ? 'To use attach to one of your quorum nodes and run loadScript(\'/examples/private-contract.js\')'
    : 'To use run ./runscript.sh private-contract.js from the network folder'
  info(exampleMsg)
  info('')
}
