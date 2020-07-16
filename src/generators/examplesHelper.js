import {
  copyFile,
  cwd, FILES,
  libRootDir,
  writeFile,
} from '../utils/fileUtils'
import { loadTesseraPublicKey } from './transactionManager'
import { isTessera } from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'
import {
  attachCommandBash,
  runscriptCommandBash,
  scriptHeader,
  validateNodeNumberInput,
} from './bashHelper'
import { isWin32 } from '../utils/execUtils'
import {
  kubernetesAttachCommand,
  kubernetesRunscriptCommand,
} from './kubernetesHelper'
import {
  dockerAttachCommand,
  dockerRunscriptCommand,
} from './dockerHelper'

export function generateAndCopyExampleScripts(config) {
  const networkPath = joinPath(cwd(), 'network', config.network.name)
  writeFile(joinPath(networkPath, FILES.runscript), generateRunScript(config), true)
  writeFile(joinPath(networkPath, FILES.attach), generateAttachScript(config), true)
  copyFile(
    joinPath(libRootDir(), 'lib', FILES.publicContract),
    joinPath(networkPath, FILES.publicContract),
  )
  if (isTessera(config.network.transactionManager)) {
    const nodeTwoPublicKey = loadTesseraPublicKey(config, 2)
    writeFile(joinPath(networkPath, FILES.privateContract),
      generatePrivateContractExample(nodeTwoPublicKey))
  }
}

function generatePrivateContractExample(privateFor) {
  return `
a = eth.accounts[0]
web3.eth.defaultAccount = a;

// abi and bytecode generated from simplestorage.sol:
// > solcjs --bin --abi simplestorage.sol
var abi = [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initVal","type":"uint256"}],"payable":false,"type":"constructor"}];

var bytecode = "0x6060604052341561000f57600080fd5b604051602080610149833981016040528080519060200190919050505b806000819055505b505b610104806100456000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632a1afcd914605157806360fe47b11460775780636d4ce63c146097575b600080fd5b3415605b57600080fd5b606160bd565b6040518082815260200191505060405180910390f35b3415608157600080fd5b6095600480803590602001909190505060c3565b005b341560a157600080fd5b60a760ce565b6040518082815260200191505060405180910390f35b60005481565b806000819055505b50565b6000805490505b905600a165627a7a72305820d5851baab720bba574474de3d09dbeaabc674a15f4dd93b974908476542c23f00029";

var simpleContract = web3.eth.contract(abi);
var simple = simpleContract.new(42, {from:web3.eth.accounts[0], data: bytecode, gas: 0x47b760, privateFor: ["${privateFor}"]}, function(e, contract) {
  if (e) {
    console.log("err creating contract", e);
  } else {
    if (!contract.address) {
      console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
    } else {
      console.log("Contract mined! Address: " + contract.address);
      console.log(contract);
    }
  }
});`
}

function getAttachCommand(config) {
  switch (config.network.deployment) {
    case 'bash':
      return attachCommandBash(config)
    case 'docker-compose':
      return dockerAttachCommand()
    case 'kubernetes':
      return kubernetesAttachCommand()
    default:
      return ''
  }
}

export function generateAttachScript(config) {
  const command = getAttachCommand(config)
  return `${scriptHeader()}
${validateNodeNumberInput(config)}
${command}`
}

function generateRunscriptCommand(config) {
  switch (config.network.deployment) {
    case 'bash':
      return runscriptCommandBash(config)
    case 'docker-compose':
      return dockerRunscriptCommand()
    case 'kubernetes':
      return kubernetesRunscriptCommand()
    default:
      return ''
  }
}

export function generateRunScript(config) {
  const command = generateRunscriptCommand(config)
  return `${scriptHeader()}
${filenameCheck()}
${command}
`
}

function filenameCheck() {
  return isWin32() ? filenameCheckWindows() : filenameCheckBash()
}

function filenameCheckWindows() {
  return `if NOT "%1"=="${FILES.privateContract}" if NOT "%1"=="${FILES.publicContract}" (
  echo Please provide a valid script file to execute (i.e. ${FILES.run}${FILES.runscript} ${FILES.privateContract}) && EXIT /B 1
)`
}

function filenameCheckBash() {
  return `if [ -z $1 ] || [ ! -f $1 ]; then
  echo "Please provide a valid script file to execute (i.e. ${FILES.run}${FILES.runscript} ${FILES.privateContract})" >&2
  exit 1
fi`
}

