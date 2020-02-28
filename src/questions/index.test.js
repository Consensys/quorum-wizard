import { prompt } from 'inquirer'
import { promptUser } from './index'
import {
  CUSTOM_QUESTIONS,
  QUICKSTART_QUESTIONS,
  SIMPLE_QUESTIONS,
} from './questions'
import {
  getCustomizedBashNodes,
  getCustomizedDockerPorts,
} from './customPromptHelper'

jest.mock('inquirer')
jest.mock('./customPromptHelper')

const QUICKSTART_CONFIG = {
  numberNodes: '3',
  consensus: 'raft',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
  deployment: 'bash',
  cakeshop: '0.11.0-RC2',
}

const SIMPLE_CONFIG = {
  numberNodes: '5',
  consensus: 'istanbul',
  quorumVersion: '2.4.0',
  transactionManager: '0.10.2',
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

describe('prompts the user with different sets of questions based on first choice', () => {
  beforeEach(() => {
    prompt.mockClear()
    getCustomizedBashNodes.mockClear()
    getCustomizedDockerPorts.mockClear()
  })
  it('quickstart', async () => {
    prompt.mockResolvedValue(QUICKSTART_CONFIG)
    await promptUser('quickstart')
    expect(prompt).toHaveBeenCalledWith(QUICKSTART_QUESTIONS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })

  it('simple', async () => {
    prompt.mockResolvedValue(SIMPLE_CONFIG)
    await promptUser('simple')
    expect(prompt).toHaveBeenCalledWith(SIMPLE_QUESTIONS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })

  it('customize, but not ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      customizePorts: false,
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(CUSTOM_QUESTIONS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })
  it('customize, bash ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(CUSTOM_QUESTIONS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(1)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(0)
  })
  it('customize, docker ports', async () => {
    prompt.mockResolvedValue({
      ...CUSTOM_CONFIG,
      deployment: 'docker-compose',
    })
    await promptUser('custom')
    expect(prompt).toHaveBeenCalledWith(CUSTOM_QUESTIONS)
    expect(getCustomizedBashNodes).toHaveBeenCalledTimes(0)
    expect(getCustomizedDockerPorts).toHaveBeenCalledTimes(1)
  })
})
