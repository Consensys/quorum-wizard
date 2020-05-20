const ipaddress = require('ip-address')
const { BigInteger } = require('jsbn')

// eslint-disable-next-line import/prefer-default-export
export function cidrsubnet(cidr, newBits, netNum) {
  const ipv4 = new ipaddress.Address4(cidr)

  const newMask = ipv4.subnetMask + newBits

  if (newMask > 32) {
    throw new Error(`Requested ${newBits}  new bits, but only ${32 - ipv4.subnetMask} are available.`)
  }

  const maxNetNum = 1 << newBits // eslint-disable-line no-bitwise

  if (netNum > maxNetNum) {
    throw new Error(`prefix extension of ${newBits} does not accommodate a subnet numbered ${netNum}`)
  }

  const addrBig = ipv4.bigInteger()
  const netNumBig = new BigInteger(netNum.toString())
  const addToIp = netNumBig << (32 - newMask) // eslint-disable-line no-bitwise
  const newAddrBig = addrBig.add(new BigInteger(addToIp.toString()))
  const newAddr = ipaddress.Address4.fromBigInteger(newAddrBig).address
  return `${newAddr}/${newMask}`
}

export function cidrhost(cidr, hostNum) {
  const ipv4 = new ipaddress.Address4(cidr)
  const hostNumBig = new BigInteger(hostNum.toString())

  const parentLen = ipv4.subnetMask
  const hostLen = 32 - parentLen

  // calculate max host num
  let maxHostNum = new BigInteger('1')
  maxHostNum <<= new BigInteger(hostLen.toString()) // eslint-disable-line no-bitwise
  maxHostNum -= new BigInteger('1')

  if (hostNum > maxHostNum) {
    throw new Error(`prefix of ${parentLen} does not accommodate a host numbered ${hostNum}`)
  }
  const startingAddrBig = ipv4.startAddress().bigInteger()
  const newAddrBig = startingAddrBig.add(hostNumBig)

  return ipaddress.Address4.fromBigInteger(newAddrBig).address
}

export function getRandomInt(min, max) {
  // The maximum is exclusive and the minimum is inclusive
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil)) + minCeil
}

export function getDockerSubnet() {
  // min=1, max=254
  const randomNetNum = getRandomInt(1, 255)
  return cidrsubnet('172.16.0.0/16', 8, randomNetNum)
}

export function buildDockerIp(ip, end) {
  const ipArray = ip.split('.').slice(0, 3)
  ipArray.push(end)
  const dockerIp = ipArray.join('.')
  return dockerIp
}
