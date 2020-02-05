import { validateNumberStringInRange } from '../utils/questionUtils'


export const INITIAL_MODE = {
  type: 'list',
  name: 'mode',
  message: 'What would you like to do?',
  choices: [
    { name: 'Quickstart (quorum-examples)', value: 1 },
    { name: 'Create Custom Network', value: 2 },
    { name: 'Exit', value: 3 }
  ]
}

export const NUMBER_NODES = {
  type: 'input', // bug with number type when invalid, can't delete old value
  name: 'numberNodes',
  message: 'How many nodes? (2-7)',
  default: '7',
  validate: (input) => validateNumberStringInRange(input, 2, 7)
}

export const CONSENSUS_MODE = {
  type: 'list',
  name: 'consensus',
  message: 'Which consensus mode?',
  choices: [
    'istanbul',
    'raft',
  ]
}

export const TRANSACTION_MANAGER = {
  type: 'list',
  name: 'transactionManager',
  message: 'Which private transaction manager?',
  choices: [
    'tessera',
    'none',
  ]
}

export const DEPLOYMENT_TYPE = {
  type: 'list',
  name: 'deployment',
  message: 'How are you going to deploy?',
  choices: [
    'bash',
    'docker-compose',
    // 'kubernetes',
    // 'vagrant',
  ]
}

export const CAKESHOP = {
  type: 'confirm',
  name: 'cakeshop',
  message: 'Do you want to include cakeshop?',
  default: false
}

export const KEY_GENERATION = {
  type: 'confirm',
  name: 'generateKeys',
  message: 'Would you like to generate key',
  default: false
}

export const NETWORK_ID = {
  type: 'input',
  name: 'networkId',
  message: 'Custom network id?',
  default: '10',
}

export const GENESIS_LOCATION = {
  type: 'input', // bug with number type when invalid, can't delete old value
  name: 'genesisLocation',
  message: 'Genesis file location',
  default: 'none',
}

export const CUSTOMIZE_PORTS = {
  type: 'confirm',
  name: 'customizePorts',
  message: 'Would you like to customize node ports? No customization currently available for docker',
  default: false
}
