import { Separator } from 'inquirer'
import {
  validateNetworkId,
  validateNumberStringInRange,
  validatePathLength,
} from './validators'
import {
  getDownloadableGethChoices,
  getDownloadableTesseraChoices,
} from '../generators/binaryHelper'
import {
  defaultNetworkName,
  isRaft,
  isBash,
  isKubernetes,
  isDocker,
  CUSTOM_CONFIG_LOCATION,
} from '../model/NetworkConfig'

import {
  getAvailableConfigs,
  getConfigsPath,
} from '../generators/networkCreator'
import {
  executeSync, isWindows, isWin32, isJava11Plus,
} from '../utils/execUtils'
import {
  exists,
  readJsonFile,
} from '../utils/fileUtils'

import {
  LATEST_QUORUM,
  LATEST_TESSERA,
} from '../generators/download'
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
    { name: 'Generate from Existing Configuration', value: 'generate' },
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
      const errorMessage = e.stdout.toString()
      if (errorMessage.indexOf('permission denied') >= 0) {
        dockerDisabled = 'Disabled, unable to run docker commands as the current user'
      } else {
        dockerDisabled = 'Disabled, docker must be running on your machine'
      }
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
  message: 'What tools would you like to deploy alongside your network? (Press space to select options, then press enter)',
  choices: (answers) => ([
    new Separator('=== Quorum Tools ==='),
    {
      name: 'Cakeshop, Quorum\'s official block explorer',
      value: 'cakeshop',
      disabled: isBash(answers.deployment) && !isJava11Plus() ? 'Disabled, Java 11+ is required to use Cakeshop' : false,
    },
    new Separator('=== Third Party Tools ==='),
    {
      name: 'Splunk, Mine your own business.',
      value: 'splunk',
      disabled: () => {
        if (!isDocker(answers.deployment)) {
          return 'Disabled, Splunk is only available with docker-compose'
        } if (isWin32()) {
          return 'Disabled, Splunk not available on Windows'
        }
        return false
      },
    },
    {
      name: 'Prometheus - prometheus geth monitoring',
      value: 'prometheus',
      disabled: () => {
        if (!isKubernetes(answers.deployment)) {
          return 'Disabled, Prometheus is only available with kubernetes'
        }
        return false
      },
    },
  ]),
  default: [],
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
  validate: (input, answers) => validatePathLength(input, answers.deployment),
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

export const GENERATE_NAME = {
  ...NETWORK_NAME,
  validate: (input, answers) => {
    const config = loadConfig(answers)
    return validatePathLength(input, config.network.deployment)
  },
  default: (answers) => {
    const config = loadConfig(answers)
    return config.network.name
  },
}

function loadConfig(answers) {
  const configPath = answers.generate === CUSTOM_CONFIG_LOCATION
    ? answers.configLocation
    : getConfigsPath(answers.generate)
  return readJsonFile(configPath)
}

export const GENERATE = {
  type: 'list',
  name: 'generate',
  message: 'Choose from the list of available config.json to generate',
  choices: () => getAvailableConfigs(),
}

export const GENERATE_LOCATION = {
  type: 'input',
  name: 'configLocation',
  message: 'Enter the path of the config.json you would like to use',
  validate: (input) => exists(input.trim()) || 'Must be a valid path',
  when: (answers) => answers.generate === CUSTOM_CONFIG_LOCATION,
  default: undefined,
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

export const QUICKSTART_ANSWERS = () => ({
  // on windows make this undefined so they can choose, and so we can check if docker is running
  deployment: isWindows() ? undefined : 'bash',
  name: '3-nodes-quickstart',
  numberNodes: 3,
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  generateKeys: false,
  tools: ['cakeshop'],
  networkId: '10',
  customizePorts: false,
})

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

export const GENERATE_QUESTIONS = [
  GENERATE,
  GENERATE_LOCATION,
  GENERATE_NAME,
]
