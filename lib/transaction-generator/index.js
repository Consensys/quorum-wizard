const fs = require('fs')
const Web3 = require('web3')
const quorumjs = require('quorum-js')
const contractMethods = require('./contract_methods.json')

const QUORUM = (
  process.env.NODE1 === undefined ||
  String(process.env.NODE1).toLowerCase() === 'false'
) ? false : true
const NODE1 = process.env.NODE1
const NODE2 = process.env.NODE2
const NODE3 = process.env.NODE3
const NODE4 = process.env.NODE4
const NODE5 = process.env.NODE5
const NODES = [NODE1,NODE2,NODE3,NODE4,NODE5]

const CONTRACT_PATH = './build/contracts/'

const web3s = []
const defaultAccounts = []
const contracts = {}

// exclusive of max
function getRandomInt(max) {
  return Math.floor(Math.random() * (max - 0));
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function copyObject(object) {
  return JSON.parse(JSON.stringify(object))
}

function initNodeConnections() {
  NODES.forEach((node) => {
    if (node !== undefined) {
      const web3 = new Web3(`ws://${node}`)
      if (QUORUM) {
        quorumjs.extend(web3)
      }
      web3s.push(web3)
    }
  })
}

async function getAccounts(web3) {
  return web3.eth.getAccounts().then((results) => {
    return results
  })
}

function valueInterpolation(value, owner) {
  if (value === '{to3rdParty}') {
    value = defaultAccounts[getRandomInt(defaultAccounts.length)]
    while (value === owner) {
      value = defaultAccounts[getRandomInt(defaultAccounts.length)]
    }
  }
  return value
}

function chooseRandomValue(values) {
  if (typeof values === 'object' && values.length !== undefined) {
    const value = values[getRandomInt(values.length)]
    return value
  }
  return values
}

function sendTransaction(name) {
  const owner = contracts[name].owner
  const index = (contracts[name].sendFromOwner) ? owner : getRandomInt(defaultAccounts.length)
  const web3 = web3s[index]
  const account = defaultAccounts[index]
  const contract = new web3.eth.Contract(
    contracts[name].abi, contracts[name].contract.options.address);
  console.log(`(${name}) sending from (${index}) ${account} to ${contracts[name].contract.options.address}`)

  if (
    contractMethods[name].staticValues === undefined &&
    contractMethods[name].randomValues === undefined
  ) {
    throw new Error('must use staticValues or randomValues')
  }

  let vals = contractMethods[name].staticValues || contractMethods[name].randomValues
  vals = copyObject(vals)
  vals.forEach((item, i) => {
    vals[i] = valueInterpolation(item, owner)
  });
  if (contractMethods[name].randomValues !== undefined) {
    vals.forEach((item, i) => {
      vals[i] = chooseRandomValue(item)
    });
  }

  contract.methods[contractMethods[name].method](...vals)
    .send({ from: account })
    .on('transactionHash', (hash) => {
      console.log(`(${name}) tx hash: ${hash}`)
    })
    .on('receipt', (receipt) => {
      console.log(`(${name}) tx successful: ${receipt.status}`)
      sendTransaction(name)
    });
}

async function deployContract(name, index) {
  const contract = contracts[name]
  const values = contractMethods[name].init.values
  const web3 = web3s[index]
  const account = defaultAccounts[index]
  const c = new web3.eth.Contract(contract.abi);
  console.log('deploying contract')
  const simple = c
    .deploy({data: contract.bytecode, arguments: values})
    .send({from: account, gas: 0x47b760})
    .on('error', console.log)
    .on('transactionHash', (hash) => {
      console.log(`(${name}) tx hash: ${hash}`)
    })
    .on('receipt', (receipt) => {
      console.log(`(${name}) tx successful: ${receipt.status}`)
    })
    .then((newContract) => {
      console.log(`contract (${name}):`, newContract.options.address)
      contracts[name].contract = newContract
      contracts[name].owner = index
      sendTransaction(name)
    })
}

async function main() {
  Object.keys(contractMethods).forEach((fileName) => {
    const compiled = JSON.parse(fs.readFileSync(`${CONTRACT_PATH}${fileName}.json`))
    contracts[fileName] = {
      abi: compiled.abi,
      bytecode: compiled.bytecode,
      sendFromOwner: contractMethods[fileName].sendFromOwner
    }
  })
  console.log(contractMethods)

  initNodeConnections()

  await asyncForEach(web3s, async (web3, i) => {
    const accounts = await getAccounts(web3)
    defaultAccounts[i] = accounts[0]
    web3.eth.defaultAccount = accounts[0]
    console.log(i, accounts[0])
  });

  Object.keys(contracts).forEach((name) => {
    deployContract(name, getRandomInt(defaultAccounts.length))
  })
}

main()
