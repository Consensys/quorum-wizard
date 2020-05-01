import {
  transformCakeshopAnswer,
  validateNetworkId,
  validateNumberStringInRange,
} from './validators'
import {
  getDownloadableGethChoices,
  getDownloadableTesseraChoices,
  getAllGethChoices,
} from '../generators/binaryHelper'
import {
  defaultNetworkName,
  isRaft,
  isKubernetes,
} from '../model/NetworkConfig'


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
All you need to do is go to the specified location and run ./start.sh

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
  message: 'Would you like to generate bash scripts or a docker-compose file to bring up your network?',
  choices: [
    'bash',
    'docker-compose',
    'kubernetes',
    // 'vagrant',
  ],
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

export const QUORUM_ALL_VERSIONS = {
  type: 'list',
  name: 'quorumVersionMore',
  message: 'Choose a later version of quorum',
  choices: ({ deployment }) => getAllGethChoices(deployment),
  when: ({ quorumVersion }) => quorumVersion === 'select older versions',
}

export const TRANSACTION_MANAGER = {
  type: 'list',
  name: 'transactionManager',
  message: 'Choose a version of tessera if you would like to use private transactions in your network, otherwise choose "none"',
  choices: ({ deployment }) => getDownloadableTesseraChoices(deployment),
}

export const CAKESHOP = {
  type: 'list', // can't transform answer from boolean on confirm questions, so it had to be a list
  name: 'cakeshop',
  message: 'Do you want to run Cakeshop (our chain explorer) with your network?',
  choices: ['No', 'Yes'],
  default: 'No',
  when: (answers) => !isKubernetes(answers.deployment),
  filter: transformCakeshopAnswer,
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
  default: (answers) => defaultNetworkName(answers.numberNodes,
    answers.consensus,
    answers.transactionManager,
    answers.deployment),
}

export const QUICKSTART_QUESTIONS = []
export const SIMPLE_QUESTIONS = [
  DEPLOYMENT_TYPE,
  CONSENSUS_MODE,
  NUMBER_NODES,
  QUORUM_VERSION,
  QUORUM_ALL_VERSIONS,
  TRANSACTION_MANAGER,
  CAKESHOP,
  NETWORK_NAME,
]
export const CUSTOM_QUESTIONS = [
  ...SIMPLE_QUESTIONS,
  KEY_GENERATION,
  NETWORK_ID,
  // GENESIS_LOCATION,
  CUSTOMIZE_PORTS,
]
