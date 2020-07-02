import { copyFile, cwd, libRootDir, writeFile } from '../utils/fileUtils'
import { loadTesseraPublicKey } from './transactionManager'
import { isTessera } from '../model/NetworkConfig'
import { joinPath } from '../utils/pathUtils'
import { setEnvironmentCommand } from './bashHelper'
import { isWin32 } from '../utils/execUtils'

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

function bashAttachCommand(config) {
  return `${setEnvironmentCommand(config)}
$BIN_GETH attach qdata/dd$1/geth.ipc`
}

function dockerAttachCommand() {
  if (isWin32()) {
    return 'docker-compose exec node%1 /bin/sh -c "geth attach qdata/dd/geth.ipc"'
  }
  return 'docker-compose exec node$1 /bin/sh -c "geth attach qdata/dd/geth.ipc"'
}

function kubernetesAttachCommand() {
  if (isWin32()) {
    return `
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /geth-helpers/geth-attach.sh`
  }
  return `POD=$('kubectl get pod --field-selector=status.phase^=Running -o name | grep quorum-node$NODE_NUMBER')
kubectl $NAMESPACE exec -it $POD -c quorum -- /geth-helpers/geth-attach.sh`
}

function getAttachCommand(config) {
  switch (config.network.deployment) {
    case 'bash':
      return bashAttachCommand(config)
    case 'docker-compose':
      return dockerAttachCommand()
    case 'kubernetes':
      return kubernetesAttachCommand()
    default:
      return ''
  }
}

function validateNodeNumberInput(config) {
  if (isWin32()) {
    return `SET NUMBER_OF_NODES=${config.nodes.length}
SET /A NODE_NUMBER=%1

if "%1"=="" (
    echo Please provide the number of the node to attach to (i.e. ./attach.sh 2) && EXIT /B 1
)

if %NODE_NUMBER% EQU 0 (
    echo Please provide the number of the node to attach to (i.e. ./attach.sh 2) && EXIT /B 1
)

if %NODE_NUMBER% GEQ %NUMBER_OF_NODES%+1 (
    echo %1 is not a valid node number. Must be between 1 and %NUMBER_OF_NODES%. && EXIT /B 1
)`
  }
  return `NUMBER_OF_NODES=${config.nodes.length}
NODE_NUMBER=$1
case "$NODE_NUMBER" in ("" | *[!0-9]*)
  echo 'Please provide the number of the node to attach to (i.e. ./attach.sh 2)' >&2
  exit 1
esac

if [ "$NODE_NUMBER" -lt 1 ] || [ "$NODE_NUMBER" -gt $NUMBER_OF_NODES ]; then
  echo "$NODE_NUMBER is not a valid node number. Must be between 1 and $NUMBER_OF_NODES." >&2
  exit 1
fi`
}

function scriptHeader() {
  return isWin32()
    ? '@ECHO OFF\nSETLOCAL'
    : '#!/bin/bash'
}

export function generateAttachScript(config) {
  const command = getAttachCommand(config)
  return `${scriptHeader()}
${validateNodeNumberInput(config)}
${command}`
}

function bashRunCommand(config) {
  return `${setEnvironmentCommand(config)}
$BIN_GETH --exec "loadScript(\\"$1\\")" attach qdata/dd1/geth.ipc`
}

function dockerRunCommand() {
  if (isWin32()) {
    // TODO fix this
    return `FOR /F "tokens=* USEBACKQ" %%g IN (\`docker-compose ps -q node1\`) DO set DOCKER_CONTAINER=%%g
docker cp %1 %DOCKER_CONTAINER%:/%1
docker-compose exec node1 /bin/sh -c "geth --exec 'loadScript(\\"%1\\")' attach qdata/dd/geth.ipc"
`
  }
  return `docker cp $1 "$(docker-compose ps -q node1)":/$1
docker-compose exec node1 /bin/sh -c "geth --exec 'loadScript(\\"$1\\")' attach qdata/dd/geth.ipc"
`
}

function kubernetesRunCommand() {
  if (isWin32()) {
    return `
SET NODE_NUMBER=1
FOR /f "delims=" %%g IN ('kubectl get pod --field-selector=status.phase^=Running -o name ^| findstr quorum-node%NODE_NUMBER%') DO set POD=%%g
ECHO ON
kubectl exec -it %POD% -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/%1
    `
  }
  return `POD=$('kubectl get pod --field-selector=status.phase^=Running -o name | grep quorum-node$NODE_NUMBER')
kubectl $NAMESPACE exec -it $POD -c quorum -- /etc/quorum/qdata/contracts/runscript.sh /etc/quorum/qdata/contracts/$1`
}

function generateRunCommand(config) {
  switch (config.network.deployment) {
    case 'bash':
      return bashRunCommand(config)
    case 'docker-compose':
      return dockerRunCommand()
    case 'kubernetes':
      return kubernetesRunCommand()
    default:
      return ''
  }
}

export function generateRunScript(config) {
  const command = generateRunCommand(config)
  return `${scriptHeader()}
${filenameCheck()}
${command}
`
}

function filenameCheck() {
  if (isWin32()) {
    return `if NOT "%1"=="private_contract.js" if NOT "%1"=="public_contract.js" (
    echo Please provide a valid script file to execute (i.e. ./runscript.sh private_contract.js) && EXIT /B 1
)`
  }
  return `if [ -z $1 ] || [ ! -f $1 ]; then
echo "Please provide a valid script file to execute (i.e. ./runscript.sh private_contract.js)" >&2
exit 1
fi`
}

// eslint-disable-next-line import/prefer-default-export
export function generateAndCopyExampleScripts(config) {
  const networkPath = joinPath(cwd(), 'network', config.network.name)
  writeFile(joinPath(networkPath, isWin32() ? 'runscript.cmd' : 'runscript.sh'), generateRunScript(config), true)
  writeFile(joinPath(networkPath, isWin32() ? 'attach.cmd' : 'attach.sh'), generateAttachScript(config), true)
  copyFile(
    joinPath(libRootDir(), 'lib', 'public_contract.js'),
    joinPath(networkPath, 'public_contract.js'),
  )
  if (isTessera(config.network.transactionManager)) {
    const nodeTwoPublicKey = loadTesseraPublicKey(config, 2)
    writeFile(joinPath(networkPath, 'private_contract.js'), generatePrivateContractExample(nodeTwoPublicKey))
  }
}
