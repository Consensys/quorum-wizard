a = eth.accounts[0]
web3.eth.defaultAccount = a;

var hash = '0x0000'

var txreceipt = null

console.log('checking for reciept')
web3.eth.getTransactionReceipt(hash, function(result) {
  console.log('receipt for ', hash)
  txreceipt = result
  console.log(JSON.stringify(result))
})
