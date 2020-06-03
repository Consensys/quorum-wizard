const NODE_HOST = process.env.NODE_HOST
const NODE_PORT = process.env.NODE_PORT

const Web3 = require('web3')
const quorumjs = require('quorum-js')

const web3 = new Web3(`ws://${NODE_HOST}:${NODE_PORT}`);

quorumjs.extend(web3)




async function getAccounts() {
  return web3.eth.getAccounts().then((results) => {
    return results
  })
}

async function getBlock() {
  return web3.eth.getBlock('latest').then((result) => {
    return result
  })
}

async function deployContract(account) {
  const abi = [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initVal","type":"uint256"}],"payable":false,"type":"constructor"}];

  const bytecode = "0x6060604052341561000f57600080fd5b604051602080610149833981016040528080519060200190919050505b806000819055505b505b610104806100456000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632a1afcd914605157806360fe47b11460775780636d4ce63c146097575b600080fd5b3415605b57600080fd5b606160bd565b6040518082815260200191505060405180910390f35b3415608157600080fd5b6095600480803590602001909190505060c3565b005b341560a157600080fd5b60a760ce565b6040518082815260200191505060405180910390f35b60005481565b806000819055505b50565b6000805490505b905600a165627a7a72305820d5851baab720bba574474de3d09dbeaabc674a15f4dd93b974908476542c23f00029";

  const simpleContract = new web3.eth.Contract(abi);

  console.log('deploying contract')
  const simple = simpleContract
    .deploy({data: bytecode, arguments: [42]})
    .send({from: account, gas: 0x47b760})
    .on('error', console.log)
    .on('transactionHash', (hash) => {
      console.log('hash:', hash)
      web3.eth.getTransaction(hash, (tx) => {
        console.log('tx')
        console.log(tx)
      })
    })
    .on('receipt', (receipt) => {
      console.log('receipt')
      console.log(receipt)
    })
    .then((newContract) => {
      console.log('contract')
      console.log(newContract)
    })
}


async function main() {
  const accounts = await getAccounts()
  console.log(accounts)
  web3.eth.defaultAccount = accounts[0]

  const sub = web3.eth.subscribe('newBlockHeaders', (error, _) => {
    if (error) console.log(error)
  })

  sub.on('data', (header) => {
    console.log('block header')
    console.log(header)

  })

  deployContract(accounts[0])
}

main()
