const Web3 = require('web3')

export default function nodekeyToAccount(nodekey) {
  const web3 = new Web3()
  const acctObj = web3.eth.accounts.privateKeyToAccount(nodekey)
  return acctObj.address
}
