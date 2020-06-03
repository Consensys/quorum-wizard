const NODE1 = process.env.NODE1
const NODE2 = process.env.NODE2
const NODE3 = process.env.NODE3
const NODE4 = process.env.NODE4
const NODE5 = process.env.NODE5
const NODES = [NODE1,NODE2,NODE3,NODE4,NODE5]

const Web3 = require('web3')
const quorumjs = require('quorum-js')

const web3s = []
const defaultAccounts = []

const simpleStorage = {
  abi: [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initVal","type":"uint256"}],"payable":false,"type":"constructor"}],
  bytecode:"0x6060604052341561000f57600080fd5b604051602080610149833981016040528080519060200190919050505b806000819055505b505b610104806100456000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632a1afcd914605157806360fe47b11460775780636d4ce63c146097575b600080fd5b3415605b57600080fd5b606160bd565b6040518082815260200191505060405180910390f35b3415608157600080fd5b6095600480803590602001909190505060c3565b005b341560a157600080fd5b60a760ce565b6040518082815260200191505060405180910390f35b60005481565b806000819055505b50565b6000805490505b905600a165627a7a72305820d5851baab720bba574474de3d09dbeaabc674a15f4dd93b974908476542c23f00029",
  contract: {}
}

function initNodeConnections() {
  NODES.forEach((node) => {
    if (node !== undefined) {
      const web3 = new Web3(`ws://${node}`)
      quorumjs.extend(web3)
      web3s.push(web3)
    }
  })
}

async function getAccounts(web3) {
  return web3.eth.getAccounts().then((results) => {
    return results
  })
}

// exclusive of max
function getRandomInt(max) {
  return Math.floor(Math.random() * (max - 0));
}

function sendTransaction() {
  const index = getRandomInt(defaultAccounts.length)
  const web3 = web3s[index]
  const account = defaultAccounts[index]
  const contract = new web3.eth.Contract(simpleStorage.abi, simpleStorage.contract.options.address);
  console.log(`sending from (${index}) ${account} to ${simpleStorage.contract.options.address}`)
  contract.methods.set(getRandomInt(50)).send({ from: account })
    .on('transactionHash', (hash) => {
      console.log('tx hash:', hash)
    })
    .on('receipt', (receipt) => {
      console.log('tx successful:', receipt.status)
      sendTransaction()
    });
}

async function deployContract(index) {
  const web3 = web3s[index]
  const account = defaultAccounts[index]
  const simpleContract = new web3.eth.Contract(simpleStorage.abi);
  console.log('deploying contract')
  const simple = simpleContract
    .deploy({data: simpleStorage.bytecode, arguments: [42]})
    .send({from: account, gas: 0x47b760})
    .on('error', console.log)
    .on('transactionHash', (hash) => {
      console.log('tx hash:', hash)
    })
    .on('receipt', (receipt) => {
      console.log('tx successful:', receipt.status)
    })
    .then((newContract) => {
      console.log('contract:', newContract.options.address)
      simpleStorage.contract = newContract
      sendTransaction()
    })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function main() {

  initNodeConnections()

  await asyncForEach(web3s, async (web3, i) => {
    const accounts = await getAccounts(web3)
    defaultAccounts[i] = accounts[0]
    web3.eth.defaultAccount = accounts[0]
    console.log(i, accounts[0])
  });

  deployContract(0)
}

main()
