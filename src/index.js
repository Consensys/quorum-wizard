#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import {
  createLogger,
  debug,
  error,
  info,
} from './utils/log'
import {
  promptUser,
  promptGenerate,
} from './questions'
import { INITIAL_MODE } from './questions/questions'
import {
  createConfigFromAnswers, isBash, isDocker, isKubernetes, isTessera, isCakeshop,
} from './model/NetworkConfig'
import {
  createNetwork,
  createQdataDirectory,
  createScripts,
  generateResourcesLocally,
  generateResourcesRemote,
} from './generators/networkCreator'
import { getFullNetworkPath } from './generators/networkHelper'
import { initBash } from './generators/bashHelper'
import { initDockerCompose, setDockerRegistry } from './generators/dockerHelper'
import { formatTesseraKeysOutput, loadTesseraPublicKey } from './generators/transactionManager'
import { downloadAndCopyBinaries } from './generators/binaryHelper'
import { setOutputPath, readJsonFile } from './utils/fileUtils'
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
  .alias('o', 'outputPath')
  .describe('o', 'Set the output path. Wizard will place all generated files into this folder. Defaults to the location where Wizard is run.')
  .string('o')
  .command('generate', '--config path to config.json', () => yargs.option('config', {
    desc: 'path to config.json',
  })
    .coerce('config', (configPath) => {
      const config = readJsonFile(configPath)
      checkValidConfig(config)
      return config
    }))
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

setOutputPath(argv.o)

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
    checkValidConfig(config)
    generateNetwork(config)
  } catch (e) {
    error(e.message)
    process.exit(1)
  }
}

function checkValidConfig(config) {
  if (!isBash(config.network.deployment) && Object.keys(config.containerPorts).length === 0) {
    throw new Error('Invalid config: containerPorts object is required for docker and kubernetes')
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
  info(`cd ${getFullNetworkPath(config)}`)
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
    info(`To use run ${wrapScript(SCRIPTS.getEndpoints.filename)} from the network folder after starting`)
    info('')
  }
  if (isCakeshop(config.network.cakeshop)) {
    if (isKubernetes(config.network.deployment)) {
      info('After starting, run ./getEndpoints on any node to get the Cakeshop url')
    } else {
      info(`After starting, Cakeshop will be accessible here: http://localhost:${config.network.cakeshopPort}`)
    }
    info('')
  }
  if (config.network.prometheus) {
    info('After starting, run ./getEndpoints on any node to get the Prometheus url')
    info('')
  }
  if (config.network.reporting) {
    info(`After starting, the Reporting Tool will be accessible here: http://localhost:${config.network.reportingUiPort}`)
    info('')
  }
  if (config.network.splunk) {
    info(`After starting, Splunk will be accessible here: http://localhost:${config.network.splunkPort}`)
    info('The default credentials are admin:changeme')
    info('')
  }
}
