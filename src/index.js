#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import isWsl from 'is-wsl'
import {
  createLogger,
  debug,
  info,
} from './utils/log'
import {
  promptUser,
  promptGenerate,
} from './questions'
import { INITIAL_MODE } from './questions/questions'
import {
  createConfigFromAnswers, isBash, isDocker, isKubernetes, isTessera,
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
import { readJsonFile } from './utils/fileUtils'
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
  .command('generate', '--config path to config.json', () => yargs.option('config', {
    desc: 'path to config.json',
  })
    .coerce('config', (configPath) => readJsonFile(configPath)))
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
} else if (argv.config) {
  generateNetwork(argv.config)
} else if (argv._[0] === 'generate') {
  regenerateNetwork()
} else {
  inquirer.prompt([INITIAL_MODE])
    .then(async ({ mode }) => {
      if (mode === 'exit') {
        info('Exiting...')
        return
      } if (mode === 'generate') {
        regenerateNetwork()
        return
      }
      buildNetwork(mode)
    })
}

async function regenerateNetwork() {
  const ans = await promptGenerate()
  try {
    const config = readJsonFile(ans.configLocation)
    config.network.name = ans.name
    generateNetwork(config)
  } catch (e) {
    info('Exiting, please provide valid config.json in configs directory')
    process.exit(1)
  }
}

async function generateNetwork(config) {
  if (isBash(config.network.deployment)) {
    await downloadAndCopyBinaries(config)
  }
  await createDirectory(config)
  createScripts(config)
  printInstructions(config)
}

async function buildNetwork(mode) {
  const answers = await promptUser(mode)
  const config = createConfigFromAnswers(answers)
  generateNetwork(config)
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
    info(`To use run ${wrapScript(SCRIPTS.getEndpoints.filename)}  from the network folder`)
    info('')
  }
}
