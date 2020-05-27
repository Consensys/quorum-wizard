import {
  buildDockerIp,
  cidrsubnet,
  cidrhost,
} from './subnetUtils'

describe('build docker ip', () => {
  it('build docker ip from docker subnet', () => {
    expect(buildDockerIp('172.16.239.0/24', '10')).toEqual('172.16.239.10')
    expect(buildDockerIp('172.16.239.0/24', '1')).toEqual('172.16.239.1')
  })
})

describe('test cidrsubnet to function like terraform', () => {
  it('cidrsubnet error - new mask too large', () => {
    expect(() => cidrsubnet('172.16.0.0/24', 16, 15))
      .toThrow(new Error('Requested 16  new bits, but only 8 are available.'))
  })
  it('cidrsubnet error - prefix extension not large enough', () => {
    expect(() => cidrsubnet('172.16.0.0/24', 8, 520))
      .toThrow(new Error('prefix extension of 8 does not accommodate a subnet numbered 520'))
  })
  it('cidrsubnet success', () => {
    expect(cidrsubnet('172.16.0.0/16', 8, 15)).toEqual('172.16.15.0/24')
  })
})

describe('test cidrhost to function like terraform', () => {
  it('cidrhost error - ', () => {
    expect(() => cidrhost('172.16.15.0/24', 256))
      .toThrow(new Error('prefix of 24 does not accommodate a host numbered 256'))
  })
  it('cidrhost success', () => {
    expect(cidrhost('172.16.15.0/24', 0)).toEqual('172.16.15.0')
    expect(cidrhost('172.16.15.0/24', 8)).toEqual('172.16.15.8')
    expect(cidrhost('172.16.15.0/24', 255)).toEqual('172.16.15.255')
  })
})
