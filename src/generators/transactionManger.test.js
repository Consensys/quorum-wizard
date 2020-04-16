import {
  loadTesseraPublicKey,
  formatTesseraKeysOutput,
} from './transactionManager'
import {
  readFileToString,
  exists,
} from '../utils/fileUtils'
import { getFullNetworkPath } from './networkCreator'
import { TEST_CWD } from '../utils/testHelper'

jest.mock('../utils/fileUtils')
jest.mock('../generators/networkCreator')
getFullNetworkPath.mockReturnValue(`${TEST_CWD}/test-network`)
readFileToString.mockReturnValue('pubkey')

const CONFIG = {
  network: {
    name: 'test',
    deployment: 'bash',
  },
  nodes: ['node1'],
}

describe('load tessera public keys', () => {
  it('load tessera public keys for bash', () => {
    exists.mockReturnValueOnce(true)
    expect(loadTesseraPublicKey(CONFIG, 1)).toEqual('pubkey')
  })
  it('print message for kubernetes', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'kubernetes',
      },
    }
    const expected = 'key to be generated by kubernetes: run ./start.sh'

    expect(loadTesseraPublicKey(config, 1)).toEqual(expected)
  })
})

describe('format tessera public keys', () => {
  it('empty string no tessera', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        transactionManager: 'none',
      },
    }

    expect(formatTesseraKeysOutput(config, 1)).toEqual('')
  })
  it('bash with tessera', () => {
    const expected = `--------------------------------------------------------------------------------

Tessera Node 1 public key:
pubkey

--------------------------------------------------------------------------------
`
    exists.mockReturnValueOnce(true)
    expect(formatTesseraKeysOutput(CONFIG, 1)).toEqual(expected)
  })
  it('kubernetes with tessera', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'kubernetes',
      },
    }
    const expected = `--------------------------------------------------------------------------------

Tessera Node 1 public key:
key to be generated by kubernetes: run ./start.sh

--------------------------------------------------------------------------------
`
    expect(formatTesseraKeysOutput(config, 1)).toEqual(expected)
  })
})
