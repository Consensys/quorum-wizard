#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import {
  createLogger,
  debug,
  info,
} from './utils/log'
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
import { generateAndCopyExampleScripts } from './generators/examplesHelper'
import {
  formatTesseraKeysOutput,
  loadTesseraPublicKey,
} from './generators/transactionManager'
import { downloadAndCopyBinaries } from './generators/binaryHelper'

const yargs = require('yargs')

const { argv } = yargs
  .boolean('q')
  .alias('q', 'quickstart')
  .describe('q', 'create 3 node raft network with tessera and cakeshop')
  .boolean('v')
  .alias('v', 'verbose')
  .describe('v', 'Turn on additional logs for debugging')
  .help()
  .alias('h', 'help')
  .version()
  .strict()

if (process.platform === 'win32') {
  info('Unfortunately, Windows OS is not yet supported by Quorum tooling.')

  process.exit(1)
}

createLogger(argv.v)
debug('Showing debug logs')

if (argv.q) {
  buildNetwork('quickstart')
} else {
  inquirer.prompt([INITIAL_MODE])
    .then(async ({ mode }) => {
      if (mode === 'exit') {
        info('Exiting...')
        return
      }
      buildNetwork(mode)
    })
}

async function buildNetwork(mode) {
  const answers = await promptUser(mode)
  const config = createConfigFromAnswers(answers)
  await downloadAndCopyBinaries(config)
  createDirectory(config)
  await createScript(config)
  generateAndCopyExampleScripts(config)
  printInstructions(config)
}

async function createScript(config) {
  if (isBash(config.network.deployment)) {
    await buildBash(config)
  } else if (isDocker(config.network.deployment)) {
    await createDockerCompose(config)
  } else {
    throw new Error('Only bash and docker deployments are supported')
  }
}

function printInstructions(config) {
  info(formatTesseraKeysOutput(config))
  info('')
  info('Quorum network created. Run the following commands to start your network:')
  info('')
  info(`cd network/${config.network.name}`)
  info('./start.sh')
  info('')
  info('A sample simpleStorage contract is provided to deploy to your network')
  info('To use run ./runscript.sh public-contract.js from the network folder')
  info('')
  if (isTessera(config.network.transactionManager)) {
    info(`A private simpleStorage contract was created with privateFor set to use Node 2's public key: ${loadTesseraPublicKey(config, 2)}`)
    info('To use run ./runscript private-contract.js from the network folder')
    info('')
  }
}
