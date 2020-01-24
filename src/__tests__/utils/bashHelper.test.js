import { createDirectory } from '../../utils/networkCreator'
import { createQuickstartConfig } from '../../model/NetworkConfig'
import { buildBashScript, buildBash } from '../../utils/bashHelper'
import { copyFile, writeFile } from '../../utils/fileUtils'
import { execute } from '../../utils/execUtils'

jest.mock('../../utils/networkCreator')
jest.mock('../../utils/fileUtils')
jest.mock('../../utils/execUtils')

describe('generates bash script details', () => {
  it('creates bash script given config details', () => {
    const expected = {
      startScript: 'startTessera\n\nstartGeth\n',
      initCommands: ['1', '2', '3', '4', '5'],
      networkPath: 'testPath'
    }
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash', false)
    createDirectory.mockReturnValueOnce({tesseraStart:  "startTessera",
        gethStart: "startGeth",
        initStart: ['1', '2', '3', '4', '5'],
        netPath: "testPath",
      })
    expect(buildBashScript(config)).toEqual(expected)
  })
})

describe('builds bash directory', () => {
  it('given bash details builds files to run bash', () => {
    let config = createQuickstartConfig('5', 'raft', 'tessera', 'bash', false)
    createDirectory.mockReturnValueOnce({tesseraStart:  "startTessera",
        gethStart: "startGeth",
        initStart: ['1', '2', '3', '4', '5'],
        netPath: "test",
      })
    buildBash()

    expect(writeFile).toBeCalledWith('test/start.sh', expect.any(String), true)
    expect(copyFile).toBeCalledTimes(4)
    expect(execute).toBeCalledTimes(5)
  })
})
