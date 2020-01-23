import { join } from 'path'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import {
  copyFile,
  createFolder
} from '../../utils/fileUtils'
import { buildCakeshopDir } from '../../utils/cakeshopHelper'

jest.mock('../../utils/fileUtils')

describe('creates a cakeshop directory structure for bash', () => {
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash' ,'yes')

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop'))
    expect(createFolder).toBeCalledWith(createNetPath(config, 'qdata/cakeshop/local'))
    expect(copyFile).toBeCalledWith(createPath('7nodes/cakeshop', 'cakeshop_bash.json'), createNetPath(config, 'qdata/cakeshop/local','cakeshop.json'))
    expect(copyFile).toBeCalledWith(createPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop/local','application.properties'))
  })
})

describe('creates a cakeshop directory structure for docker', () => {
  it('creates directory structure for cakeshop files and moves them in', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'docker-compose' ,'yes')

    buildCakeshopDir(config, createNetPath(config, 'qdata'))
    expect(createFolder).toBeCalledWith(createNetPath(config, `qdata/cakeshop`))
    expect(copyFile).toBeCalledWith(createPath('7nodes/cakeshop', 'cakeshop_docker-compose.json'), createNetPath(config, 'qdata/cakeshop','cakeshop.json'))
    expect(copyFile).toBeCalledWith(createPath('lib', 'cakeshop_application.properties.template'), createNetPath(config, 'qdata/cakeshop','application.properties'))
  })
})

function createPath(...relativePaths) {
  return join(process.cwd(), ...relativePaths)
}

function createNetPath(config, ...relativePaths) {
  return join(process.cwd(), 'network', config.network.name, ...relativePaths)
}
