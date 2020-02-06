import { createDirectory } from '../../utils/networkCreator'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import { buildBashScript, buildBash, waitForTesseraNodesCommand } from '../../utils/bashHelper'
import { copyFile, cwd, writeFile } from '../../utils/fileUtils'
import { execute } from '../../utils/execUtils'
import { TEST_CWD } from '../testHelper'
import { pathToCakeshop, pathToQuorumBinary, pathToTesseraJar } from '../../utils/binaryHelper'

jest.mock('../../utils/networkCreator')
jest.mock('../../utils/fileUtils')
jest.mock('../../utils/execUtils')
jest.mock('../../utils/binaryHelper')
cwd.mockReturnValue(TEST_CWD)
pathToQuorumBinary.mockReturnValue('geth')
pathToTesseraJar.mockReturnValue('tessera')
pathToCakeshop.mockReturnValue('cakeshop')

describe('generates bash script details', () => {
  it('creates bash script given config details', () => {
    let config = createQuickstartConfig({
      numberNodes: '5',
      consensus: 'raft',
      quorumVersion: '2.4.0',
      transactionManager: '0.10.2',
      deployment: 'bash',
      cakeshop: false
    })
    const expected = {
      startScript: `BIN_GETH=geth\nBIN_TESSERA=tessera\n\nstartTessera\n${waitForTesseraNodesCommand(config)}\nstartGeth\n`,
      initCommands: ['1', '2', '3', '4', '5'],
      networkPath: 'testPath'
    }
    createDirectory.mockReturnValueOnce({tesseraStart:  "startTessera",
        gethStart: "startGeth",
        initStart: ['1', '2', '3', '4', '5'],
        netPath: "testPath",
      })
    expect(buildBashScript(config)).toEqual(expected)
  })
})

describe('builds bash directory', () => {
  it('given bash details builds files to run bash', async () => {
    let config = createQuickstartConfig({
      numberNodes: '5',
      consensus: 'raft',
      quorumVersion: '2.4.0',
      transactionManager: '0.10.2',
      deployment: 'bash',
      cakeshop: false
    })
    createDirectory.mockReturnValueOnce({tesseraStart:  "startTessera",
        gethStart: "startGeth",
        initStart: ['1', '2', '3', '4', '5'],
        netPath: "test",
      })
    await buildBash(config)

    expect(writeFile).toBeCalledWith('test/start.sh', expect.any(String), true)
    expect(copyFile).toBeCalledTimes(4)
    expect(execute).toBeCalledTimes(5)
  })
})
