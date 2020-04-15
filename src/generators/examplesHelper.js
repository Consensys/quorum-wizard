import {
  copyFile,
  cwd,
  libRootDir,
  writeFile,
} from '../utils/fileUtils'
import { loadTesseraPublicKey } from './transactionManager'
import { isTessera } from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'
import { setEnvironmentCommand } from './bashHelper'

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
  const bashCommand = `${setEnvironmentCommand(config)}
$BIN_GETH attach qdata/dd$1/geth.ipc`

  const dockerCommand = 'docker-compose exec node$1 /bin/sh -c "geth attach qdata/dd/geth.ipc"'

  const kubernetesCommand = `POD=$(kubectl get pods $NAMESPACE | grep Running | grep 1 | awk '{print $1}')
kubectl $NAMESPACE exec -it $POD -c quorum -- /bin/ash -c "geth attach /etc/quorum/qdata/dd/geth.ipc"`

  switch (config.network.deployment) {
    case 'bash':
      return bashCommand
    case 'docker-compose':
      return dockerCommand
    case 'kubernetes':
    default:
      return kubernetesCommand
  }
}

export function generateAttachScript(config) {
  const command = getAttachCommand(config)
  return `#!/bin/bash
NUMBER_OF_NODES=${config.nodes.length}
case "$1" in ("" | *[!0-9]*)
  echo 'Please provide the number of the node to attach to (i.e. ./attach.sh 2)' >&2
  exit 1
esac

if [ "$1" -lt 1 ] || [ "$1" -gt $NUMBER_OF_NODES ]; then
  echo "$1 is not a valid node number. Must be between 1 and $NUMBER_OF_NODES." >&2
  exit 1
fi

${command}`
}

function generateRunCommand(config) {
  const bashCommand = `${setEnvironmentCommand(config)}
$BIN_GETH --exec "loadScript(\\"$1\\")" attach qdata/dd1/geth.ipc`
  const dockerCommand = `docker cp $1 "$(docker-compose ps -q node1)":/$1
docker-compose exec node1 /bin/sh -c "geth --exec 'loadScript(\\"$1\\")' attach qdata/dd/geth.ipc"
`
  const kubernetesCommand = `POD=$(kubectl get pods $NAMESPACE | grep Running | grep 1 | awk '{print $1}')
kubectl $NAMESPACE exec -it $POD -c quorum -- /bin/ash -c "geth --exec 'loadScript(\\"/etc/quorum/qdata/contracts/$1\\")' attach /etc/quorum/qdata/dd/geth.ipc"`
  switch (config.network.deployment) {
    case 'bash':
      return bashCommand
    case 'docker-compose':
      return dockerCommand
    case 'kubernetes':
    default:
      return kubernetesCommand
  }
}
export function generateRunScript(config) {
  const command = generateRunCommand(config)
  return `#!/bin/bash
if [ -z $1 ] || [ ! -f $1 ]; then
  echo "Please provide a valid script file to execute (i.e. ./runscript.sh private_contract.js)" >&2
  exit 1
fi

${command}
`
}

// eslint-disable-next-line import/prefer-default-export
export function generateAndCopyExampleScripts(config) {
  const networkPath = joinPath(cwd(), 'network', config.network.name)
  writeFile(joinPath(networkPath, 'runscript.sh'), generateRunScript(config), true)
  writeFile(joinPath(networkPath, 'attach.sh'), generateAttachScript(config), true)
  copyFile(
    joinPath(libRootDir(), 'lib', 'public_contract.js'),
    joinPath(networkPath, 'public_contract.js'),
  )
  if (isTessera(config.network.transactionManager)) {
    const nodeTwoPublicKey = loadTesseraPublicKey(config, 2)
    writeFile(joinPath(networkPath, 'private_contract.js'), generatePrivateContractExample(nodeTwoPublicKey))
  }
}
