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
  isKubernetes,
} from './model/NetworkConfig'
import {
  createQdataDirectory,
  createNetwork,
  generateResourcesLocally,
  generateResourcesRemote,
} from './generators/networkCreator'
import { buildBash } from './generators/bashHelper'
import { createDockerCompose } from './generators/dockerHelper'
import { createKubernetes } from './generators/kubernetesHelper'
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
  if (isBash(config.network.deployment)) {
    await downloadAndCopyBinaries(config)
  }
  await createDirectory(config)
  await createScript(config)
  generateAndCopyExampleScripts(config)
  printInstructions(config)
}

async function createDirectory(config) {
  if (isBash(config.network.deployment)) {
    createNetwork(config)
    await generateResourcesLocally(config)
    createQdataDirectory(config)
  } else if (isDocker(config.network.deployment)) {
    createNetwork(config)
    generateResourcesRemote(config)
    createQdataDirectory(config)
  } else if (isKubernetes(config.network.deployment)) {
    createNetwork(config)
    generateResourcesRemote(config)
  } else {
    throw new Error('Only bash, docker, and kubernetes deployments are supported')
  }
}

async function createScript(config) {
  if (isBash(config.network.deployment)) {
    await buildBash(config)
  } else if (isDocker(config.network.deployment)) {
    await createDockerCompose(config)
  } else if (isKubernetes(config.network.deployment)) {
    await createKubernetes(config)
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
    info('Running the kubernetes deployment is currently only supported on minikube.')
    info('Before starting the network please make sure minikube is running and kubectl is installed and setup properly')
    info('Check out our qubernetes project docs for more info: https://github.com/jpmorganchase/qubernetes')
    info('')
  }
  info('Run the following commands to start your network:')
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
  if (isKubernetes(config.network.deployment)) {
    info('A script to retrieve the quorum rpc and tessera 3rd party endpoints to use with remix or cakeshop is provided')
    info('To use run ./getEndpoints.sh from the network folder')
    info('')
  }
}
