#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import { join } from 'path'
import { info } from './utils/log'
import { promptUser } from './questions'
import { INITIAL_MODE } from './questions/questions'
import {
  createConfigFromAnswers,
  isBash,
  isDocker,
  isTessera,
} from './model/NetworkConfig'
import { createDirectory } from './generators/networkCreator'
import { buildBash } from './generators/bashHelper'
import { createDockerCompose } from './generators/dockerHelper'
import {
  cwd,
  readFileToString,
} from './utils/fileUtils'
import { generateAndCopyExampleScripts } from './generators/examplesHelper'

inquirer.prompt([INITIAL_MODE])
  .then(async ({ mode }) => {
    if (mode === 'exit') {
      info('Exiting...')
      return
    }

    const answers = await promptUser(mode)
    const config = createConfigFromAnswers(answers)
    createDirectory(config)
    await createScript(config)

    // TODO move this to start.sh so they see it every time they run the network?
    const lastNodePubKey = printTesseraKeys(config)

    generateAndCopyExampleScripts(config, lastNodePubKey)
    printInstructions(config, lastNodePubKey)
  })

async function createScript(config) {
  if (isBash(config.network.deployment)) {
    await buildBash(config)
  } else if (isDocker(config.network.deployment)) {
    await createDockerCompose(config)
  }
}

function printTesseraKeys(config) {
  const qdata = join(cwd(), 'network', config.network.name, 'qdata')
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
  return pubKey
}

function printInstructions(config, lastNodesPubKey) {
  info('')
  info('Quorum network created. Run the following commands to start your network:')
  info('')
  info(`cd network/${config.network.name}`)
  info('./start.sh')
  info('')
  info('A sample private and public simpleStorage contract are provided to deploy to your network')
  const tesseraMsg = isTessera(config.network.transactionManager)
    ? `The private contract has privateFor set as ${lastNodesPubKey}\n`
    : ''
  info(tesseraMsg)
  const exampleMsg = isDocker(config.network.deployment)
    ? 'To use attach to one of your quorum nodes and run loadScript(\'/examples/private-contract.js\')'
    : 'To use run ./runscript.sh private-contract.js from the network folder'
  info(exampleMsg)
  info('')
}
