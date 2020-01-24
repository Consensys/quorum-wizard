import { join } from 'path'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import {
  copyFile,
  createFolder,
  writeJsonFile
} from '../../utils/fileUtils'
import { buildCakeshopDir, generateCakeshopFiles } from '../../utils/cakeshopHelper'
import { anything } from 'expect'

jest.mock('../../utils/fileUtils')

describe('creates a cakeshop directory structure for bash', () => {
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash' , true)

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'))
    expect(copyFile).toBeCalledWith(createPath('7nodes/cakeshop', 'cakeshop_bash.json'), createNetPath(config, 'qdata/cakeshop/local','cakeshop.json'))
    expect(copyFile).toBeCalledWith(createPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop/local','application.properties'))
  })
})

describe('creates a cakeshop directory structure for docker', () => {
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'docker-compose' , true)

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop'))
    expect(copyFile).toBeCalledWith(createPath('7nodes/cakeshop', 'cakeshop_docker-compose.json'), createNetPath(config, 'qdata/cakeshop','cakeshop.json'))
    expect(copyFile).toBeCalledWith(createPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop','application.properties'))
  })
})

describe('generates custom cakeshop files', () => {
  it('creates cakeshop json file with ports for bash', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash' , true)

    generateCakeshopFiles(config, createNetPath(config, 'cakeshop'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'cakeshop'))
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'cakeshop'), 'cakeshop_bash.json', anything())

  })
})

describe('generates custom cakeshop files', () => {
  it('creates cakeshop json file with ports for docker-compose', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'docker-compose' , true)

    generateCakeshopFiles(config, createNetPath(config, 'cakeshop'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'cakeshop'))
    expect(writeJsonFile).toBeCalledWith(createNetPath(config, 'cakeshop'), 'cakeshop_docker-compose.json', anything())

  })
})

function createPath(...relativePaths) {
  return join(process.cwd(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(process.cwd(), 'network', config.network.name, ...relativePaths)
}
