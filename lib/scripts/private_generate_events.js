var address = '0x99b5cac07e3c1599458c24d3d4266ca1de4bb6f3';

// simple contract
var abi = [
  {
      constant: true,
      inputs: [],
      name: 'storedData',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      type: 'function',
  },
  {
      constant: false,
      inputs: [{ name: 'x', type: 'uint256' }],
      name: 'set',
      outputs: [],
      payable: false,
      type: 'function',
  },
  {
      constant: true,
      inputs: [],
      name: 'get',
      outputs: [{ name: 'retVal', type: 'uint256' }],
      payable: false,
      type: 'function',
  },
  { inputs: [{ name: 'initVal', type: 'uint256' }], payable: false, type: 'constructor' },
];
var contract = eth.contract(abi).at(address);

for (i = 0; i < 20; i++) {
  contract.set(4, {
      from: eth.accounts[0],
      privateFor: ['BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo=', 'QfeDAys9MPDs2XHExtc84jKGHxZg/aj52DTh0vtA3Xc='],
  });
}
