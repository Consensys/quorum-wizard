import { prompt } from 'inquirer'
import {
  promptUser,
  promptGenerate,
} from './index'
import {
  CUSTOM_ANSWERS, NETWORK_CONFIRM, NETWORK_NAME,
  QUESTIONS,
  QUICKSTART_ANSWERS,
  SIMPLE_ANSWERS,
  GENERATE_QUESTIONS,
} from './questions'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
} from './customPromptHelper'
import { exists } from '../utils/fileUtils'
import { LATEST_CAKESHOP, LATEST_QUORUM, LATEST_TESSERA } from '../generators/download'
import { CUSTOM_CONFIG_LOCATION } from '../model/NetworkConfig'

jest.mock('inquirer')
jest.mock('./customPromptHelper')
jest.mock('../generators/networkCreator')
jest.mock('../utils/fileUtils')
exists.mockReturnValue(false)

const QUICKSTART_CONFIG = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  cakeshop: LATEST_CAKESHOP,
}

const SIMPLE_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  quorumVersion: LATEST_QUORUM,
  transactionManager: LATEST_TESSERA,
  deployment: 'bash',
  cakeshop: 'none',
}

const CUSTOM_CONFIG = {
  ...SIMPLE_CONFIG,
  generateKeys: false,
  networkId: 10,
  genesisLocation: 'testDir',
  customizePorts: true,
  nodes: ['nodes'],
}

const GENERATE_ANSWERS = {
  generate: '1-config.json',
  configLocation: undefined,
  name: '1',
}

const GENERATE_CUSTOM_CONFIG_LOCATION_ANSWERS = {
  generate: CUSTOM_CONFIG_LOCATION,
  configLocation: 'custom/config/location.json',
  name: '2',
}

const GENERATE_NO_NAME_ANSWERS = {
  generate: '1-config.json',
}

describe('prompts the user with different sets of questions based on first choice', () => {
  beforeEach(() => {
    prompt.mockClear()
    getCustomizedBashNodes.mockClear()
    getCustomizedDockerPorts.mockClear()
  })
  it('quickstart', async () => {
    prompt.mockResolvedValueOnce(QUICKSTART_CONFIG)
    await promptUser('quickstart')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, QUICKSTART_ANSWERS)
    expect(prompt).not.toHaveBeenCalledWith([NETWORK_CONFIRM], expect.anything())
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })

  it('quickstart, overwrite network', async () => {
    prompt.mockResolvedValueOnce(QUICKSTART_CONFIG)
    prompt.mockResolvedValueOnce({ ...QUICKSTART_CONFIG, overwrite: true })
    exists.mockReturnValueOnce(true)
    await promptUser('quickstart')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, QUICKSTART_ANSWERS)
    expect(prompt).toHaveBeenCalledWith([NETWORK_CONFIRM], QUICKSTART_CONFIG)
    expect(prompt).not.toHaveBeenCalledWith([NETWORK_NAME], QUICKSTART_CONFIG)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })

  it('quickstart, do not overwrite network, change name', async () => {
    prompt.mockResolvedValueOnce(QUICKSTART_CONFIG)
    prompt.mockResolvedValueOnce({ ...QUICKSTART_CONFIG, overwrite: false })
    prompt.mockResolvedValueOnce({ ...QUICKSTART_CONFIG, name: 'newname' })
    exists.mockReturnValueOnce(true)
    await promptUser('quickstart')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, QUICKSTART_ANSWERS)
    expect(prompt).toHaveBeenCalledWith([NETWORK_CONFIRM], QUICKSTART_CONFIG)
    expect(prompt).toHaveBeenCalledWith([NETWORK_NAME], QUICKSTART_CONFIG)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })


  it('simple', async () => {
    prompt.mockResolvedValue(SIMPLE_CONFIG)
    await promptUser('simple')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, SIMPLE_ANSWERS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })

  it('customize, but not ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      customizePorts: false,
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })
  it('customize, bash ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      cakeshop: LATEST_CAKESHOP,
      consensus: 'raft',
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(1)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })
  it('customize, docker ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      deployment: 'docker-compose',
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(1)
  })
  it('customize, kubernetes ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      deployment: 'kubernetes',
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(QUESTIONS, CUSTOM_ANSWERS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })
  it('regenerate', async () => {
    prompt.mockResolvedValue(GENERATE_ANSWERS)
    await promptGenerate()
    expect(prompt).toHaveBeenCalledWith(GENERATE_QUESTIONS)
  })
  it('regenerate - user input config file', async () => {
    prompt.mockResolvedValue(GENERATE_CUSTOM_CONFIG_LOCATION_ANSWERS)
    await promptGenerate()
    expect(prompt).toHaveBeenCalledWith(GENERATE_QUESTIONS)
  })
  it('regenerate - no name config file', async () => {
    prompt.mockResolvedValue(GENERATE_NO_NAME_ANSWERS)
    await promptGenerate()
    expect(prompt).toHaveBeenCalledWith(GENERATE_QUESTIONS)
  })
})
