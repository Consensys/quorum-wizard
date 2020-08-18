import {
  loadTesseraPublicKey,
  formatTesseraKeysOutput,
} from './transactionManager'
import { readFileToString } from '../utils/fileUtils'
import { getFullNetworkPath } from './networkHelper'
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

const EXPECTED = `--------------------------------------------------------------------------------

Tessera Node 1 public key:
pubkey

--------------------------------------------------------------------------------
`

describe('load tessera public keys', () => {
  it('load tessera public keys for bash', () => {
    expect(loadTesseraPublicKey(CONFIG, 1)).toEqual('pubkey')
  })
  it('load tessera public keys for docker', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'docker-compose',
      },
    }

    expect(loadTesseraPublicKey(config, 1)).toEqual('pubkey')
  })
  it('load tessera public keys for kubernetes', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'kubernetes',
      },
    }

    expect(loadTesseraPublicKey(config, 1)).toEqual('pubkey')
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
    expect(formatTesseraKeysOutput(CONFIG, 1)).toEqual(EXPECTED)
  })
  it('docker with tessera', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'docker-compose',
      },
    }
    expect(formatTesseraKeysOutput(config, 1)).toEqual(EXPECTED)
  })
  it('kubernetes with tessera', () => {
    const config = {
      ...CONFIG,
      network: {
        ...CONFIG.network,
        deployment: 'kubernetes',
      },
    }
    expect(formatTesseraKeysOutput(config, 1)).toEqual(EXPECTED)
  })
})
