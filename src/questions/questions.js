import {
  transformCakeshopAnswer,
  transformSplunkAnswer,
  transformTxGenerateAnswer,
  validateNetworkId,
  validateNumberStringInRange,
} from './validators'
import {
  getDownloadableGethChoices,
  getDownloadableTesseraChoices,
} from '../generators/binaryHelper'
import {
  defaultNetworkName,
  isRaft,
  isKubernetes, isBash, isDocker
} from '../model/NetworkConfig'

import {
  executeSync, isJava8, isJavaMissing, isWindows, isWin32
} from '../utils/execUtils'
import {
  LATEST_CAKESHOP,
  LATEST_CAKESHOP_J8,
  LATEST_QUORUM,
  LATEST_TESSERA,
  LATEST_TESSERA_J8,
} from '../generators/download'
import { Separator } from 'inquirer'
import { error } from '../utils/log'
import SCRIPTS from '../generators/scripts'

export const INITIAL_MODE = {
  type: 'list',
  name: 'mode',
  message: `
Welcome to Quorum Wizard!

This tool allows you to easily create bash, docker, and kubernetes files to start up a quorum network.
You can control consensus, privacy, network details and more for a customized setup.
Additionally you can choose to deploy our chain explorer, Cakeshop, to easily view and monitor your network.

We have 3 options to help you start exploring Quorum:

  1.  Quickstart - our 1 click option to create a 3 node raft network with tessera and cakeshop

  2.  Simple Network - using pregenerated keys from quorum 7nodes example,
      this option allows you to choose the number of nodes (7 max), consensus mechanism, transaction manager, and the option to deploy cakeshop

  3.  Custom Network - In addition to the options available in #2, this selection allows for further customization of your network.
      Choose to generate keys, customize ports for both bash and docker, or change the network id

Quorum Wizard will generate your startup files and everything required to bring up your network.
All you need to do is go to the specified location and run ${SCRIPTS.start.filename}

`,

  choices: [
    {
      name: 'Quickstart (3-node raft network with tessera and cakeshop)',
      value: 'quickstart',
    },
    { name: 'Simple Network', value: 'simple' },
    { name: 'Custom Network', value: 'custom' },
    { name: 'Exit', value: 'exit' },
  ],
}

export const DEPLOYMENT_TYPE = {
  type: 'list',
  name: 'deployment',
  message: 'Would you like to generate bash scripts, a docker-compose file, or a kubernetes config to bring up your network?',
  choices: () => {
    let dockerDisabled = false
    try {
      executeSync('docker info 2>&1')
    } catch (e) {
      // any error means docker isn't running
      dockerDisabled = 'Disabled, docker must be running on your machine'
    }

    const bashDisabled = isWindows() ? 'Disabled, Bash not supported on Windows systems' : false

    if (dockerDisabled && bashDisabled) {
      error('Docker must be running on your machine to use the wizard on Windows.')
      process.exit(1)
    }

    return [
      { name: 'bash', disabled: bashDisabled },
      { name: 'docker-compose', disabled: dockerDisabled },
      { name: 'kubernetes', disabled: dockerDisabled },
    ]
  },
}

export const NUMBER_NODES = {
  type: 'input',
  name: 'numberNodes',
  message: (answers) => (isRaft(answers.consensus)
    ? 'Input the number of nodes (2-7) you would like in your network - a minimum of 3 is recommended'
    : 'Input the number of nodes (2-7) you would like in your network - a minimum of 4 is recommended'),
  default: (answers) => (isRaft(answers.consensus) ? '3' : '4'),
  validate: (input) => validateNumberStringInRange(input, 2, 7),
}

export const CONSENSUS_MODE = {
  type: 'list',
  name: 'consensus',
  message: 'Select your consensus mode - istanbul is a pbft inspired algorithm with transaction finality while raft provides faster blocktimes, transaction finality and on-demand block creation',
  choices: [
    'istanbul',
    'raft',
  ],
}

export const QUORUM_VERSION = {
  type: 'list',
  name: 'quorumVersion',
  message: 'Which version of Quorum would you like to use?',
  choices: ({ deployment }) => getDownloadableGethChoices(deployment),
}

export const TRANSACTION_MANAGER = {
  type: 'list',
  name: 'transactionManager',
  message: 'Choose a version of tessera if you would like to use private transactions in your network, otherwise choose "none"',
  choices: ({ deployment }) => getDownloadableTesseraChoices(deployment),
}

export const TOOLS = {
  type: 'checkbox',
  name: 'tools',
  message: 'What tools would you like to deploy alongside your network?',
  choices: (answers) => ([
    new Separator('=== Quorum Tools ==='),
    {
      name: 'Cakeshop, Quorum\'s official block explorer',
      value: 'cakeshop',
      disabled: isBash(answers.deployment) && isJavaMissing() ? 'Disabled, Java is required to use Cakeshop' : false
    },
    new Separator('=== Third Party Tools ==='),
    {
      name: 'Splunk, Mine your own business.',
      value: 'splunk',
      disabled: !isDocker(answers.deployment) || isWin32() ? 'Disabled, splunk is available with docker-compose' : false
    },
    {
      name: 'Splunk Transaction Auto-generator',
      value: 'txGenerate',
      disabled: !isDocker(answers.deployment) ? 'Disabled, transaction generator is available with docker-compose' : false
    },
  ]),
  default: [],
  when: (answers) => !isKubernetes(answers.deployment)
}

export const KEY_GENERATION = {
  type: 'confirm',
  name: 'generateKeys',
  message: 'Would you like to generate keys for your network? (selecting \'no\' will use insecure keys that are not suitable for Production use)',
  default: true,
}

export const NETWORK_ID = {
  type: 'input',
  name: 'networkId',
  message: '10 is the default network id in quorum but you can use a different one',
  default: '10',
  validate: (input) => validateNetworkId(input),
}

export const GENESIS_LOCATION = {
  type: 'input',
  name: 'genesisLocation',
  message: 'If you would like to use your own genesis file: enter the file location:',
  default: 'none',
}

export const CUSTOMIZE_PORTS = {
  type: 'confirm',
  name: 'customizePorts',
  message: 'Would you like to customize your node ports?',
  when: (answers) => !isKubernetes(answers.deployment),
  default: false,
}

export const NETWORK_NAME = {
  type: 'input',
  name: 'name',
  message: 'What would you like to call this network?',
  validate: (input) => input.trim() !== '' || 'Network name must not be blank.',
  default: (answers) => defaultNetworkName(answers.numberNodes,
    answers.consensus,
    answers.transactionManager,
    answers.deployment),
}

export const NETWORK_CONFIRM = {
  type: 'confirm',
  name: 'overwrite',
  message: (answers) => `A network with the name '${answers.name}' already exists. Do you want to overwrite it?`,
  default: false,
}

export const QUESTIONS = [
  DEPLOYMENT_TYPE,
  CONSENSUS_MODE,
  NUMBER_NODES,
  QUORUM_VERSION,
  TRANSACTION_MANAGER,
  TOOLS,
  KEY_GENERATION,
  NETWORK_ID,
  // GENESIS_LOCATION,
  NETWORK_NAME,
  CUSTOMIZE_PORTS,
]

export const QUICKSTART_ANSWERS = () => {
  let deployment; let transactionManager; let
    cakeshop
  if (isWindows()) {
    // on windows make this undefined so they can choose, and so we can check if docker is running
    deployment = undefined

    // only containers, no need to worry about java version
    transactionManager = LATEST_TESSERA
    cakeshop = LATEST_CAKESHOP
  } else {
    deployment = 'bash'
    transactionManager = isJava8() ? LATEST_TESSERA_J8 : LATEST_TESSERA
    cakeshop = isJava8() ? LATEST_CAKESHOP_J8 : LATEST_CAKESHOP
  }
  return {
    deployment,
    name: '3-nodes-quickstart',
    numberNodes: 3,
    consensus: 'raft',
    quorumVersion: LATEST_QUORUM,
    transactionManager,
    generateKeys: false,
    tools: ['cakeshop'],
    networkId: '10',
    customizePorts: false,
  }
}

export const SIMPLE_ANSWERS = {
  generateKeys: false,
  networkId: '10',
  customizePorts: false,
}

export const CUSTOM_ANSWERS = {}

export function getPrefilledAnswersForMode(mode) {
  switch (mode) {
    case 'quickstart':
      return QUICKSTART_ANSWERS()
    case 'simple':
      return SIMPLE_ANSWERS
    case 'custom':
      return CUSTOM_ANSWERS
    default:
      throw new Error(`Unknown option: ${mode}`)
  }
}
