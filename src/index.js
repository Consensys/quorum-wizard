#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import { createLogger, debug, info } from './utils/log'
import { promptUser } from './questions'
import { INITIAL_MODE } from './questions/questions'
import {
  createConfigFromAnswers, isBash, isDocker, isKubernetes, isTessera, isCakeshop
} from './model/NetworkConfig'
import {
  createNetwork,
  createQdataDirectory,
  createScripts,
  generateResourcesLocally,
  generateResourcesRemote,
} from './generators/networkCreator'
import { initBash } from './generators/bashHelper'
import { initDockerCompose, setDockerRegistry } from './generators/dockerHelper'
import { formatTesseraKeysOutput, loadTesseraPublicKey } from './generators/transactionManager'
import { downloadAndCopyBinaries } from './generators/binaryHelper'
import { wrapScript } from './utils/pathUtils'
import SCRIPTS from './generators/scripts'

const yargs = require('yargs')

const { argv } = yargs
  .boolean('q')
  .alias('q', 'quickstart')
  .describe('q', 'create 3 node raft network with tessera and cakeshop')
  .boolean('v')
  .alias('v', 'verbose')
  .describe('v', 'Turn on additional logs for debugging')
  .string('r')
  .alias('r', 'registry')
  .describe('r', 'Use a custom docker registry (instead of registry.hub.docker.com)')
  .help()
  .alias('h', 'help')
  .version()
  .strict()

createLogger(argv.v)
debug('Showing debug logs')
setDockerRegistry(argv.r)

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
  if (isBash(config.network.deployment)) {
    await downloadAndCopyBinaries(config)
  }
  await createDirectory(config)
  createScripts(config)
  printInstructions(config)
}

async function createDirectory(config) {
  createNetwork(config)
  if (isBash(config.network.deployment)) {
    await generateResourcesLocally(config)
    createQdataDirectory(config)
    await initBash(config)
  } else if (isDocker(config.network.deployment)) {
    generateResourcesRemote(config)
    createQdataDirectory(config)
    await initDockerCompose(config)
  } else if (isKubernetes(config.network.deployment)) {
    generateResourcesRemote(config)
  } else {
    throw new Error('Only bash, docker, and kubernetes deployments are supported')
  }
}

function printInstructions(config) {
  info(formatTesseraKeysOutput(config))
  info('')
  info('Quorum network created')
  info('')
  if (isKubernetes(config.network.deployment)) {
    info('Before starting the network please make sure kubectl is installed and setup properly')
    info('Check out our qubernetes project docs for more info: https://github.com/jpmorganchase/qubernetes')
    info('')
  }
  info('Run the following commands to start your network:')
  info('')
  info(`cd network/${config.network.name}`)
  info(`${wrapScript(SCRIPTS.start.filename)}`)
  info('')
  info('A sample simpleStorage contract is provided to deploy to your network')
  info(`To use run ${wrapScript(SCRIPTS.runscript.filename)} ${SCRIPTS.publicContract.filename} from the network folder`)
  info('')
  if (isTessera(config.network.transactionManager)) {
    info(`A private simpleStorage contract was created with privateFor set to use Node 2's public key: ${loadTesseraPublicKey(config, 2)}`)
    info(`To use run ${wrapScript(SCRIPTS.runscript.filename)} ${SCRIPTS.privateContract.filename} from the network folder`)
    info('')
  }
  if (isKubernetes(config.network.deployment)) {
    info('A script to retrieve the quorum rpc and tessera 3rd party endpoints to use with remix or cakeshop is provided')
    if (isCakeshop(config.network.cakeshop)) {
      info('You will be able to get the cakeshop url by running the below script for any node')
    }
    info(`To use run ${wrapScript(SCRIPTS.getEndpoints.filename)}  from the network folder`)
    info('')
  }
}
