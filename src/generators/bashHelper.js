import {
  getFullNetworkPath,
} from './networkCreator'
import {
  copyFile,
  libRootDir,
  writeFile,
} from '../utils/fileUtils'
import { executeSync } from '../utils/execUtils'
import {
  buildCakeshopDir,
  generateCakeshopScript,
} from './cakeshopHelper'
import {
  isQuorum260Plus,
  pathToCakeshop,
  pathToQuorumBinary,
  pathToTesseraJar,
} from './binaryHelper'
import {
  isRaft,
  isTessera,
  isCakeshop,
} from '../model/NetworkConfig'
import { info } from '../utils/log'
import { formatTesseraKeysOutput } from './transactionManager'
import { joinPath } from '../utils/pathUtils'

export function buildBashScript(config) {
  const commands = createCommands(config)

  const startScript = [
    '#!/bin/bash',
    'echo "\nStarting Quorum network...\n"',
    setEnvironmentCommand(config),
    commands.tesseraStart,
    waitForTesseraNodesCommand(config),
    'echo "Starting Quorum nodes"',
    commands.gethStart,
    generateCakeshopScript(config),
    'echo "Successfully started Quorum network."',
    `echo "${formatTesseraKeysOutput(config)}"`,
  ]

  return {
    startScript: startScript.join('\n'),
    initCommands: commands.initStart,
  }
}

export function createCommands(config) {
  const networkPath = getFullNetworkPath(config)
  const initCommands = []
  const startCommands = []
  const tmStartCommands = []

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const quorumDir = joinPath('qdata', `dd${nodeNumber}`)
    const tmDir = joinPath('qdata', `c${nodeNumber}`)
    const genesisLocation = joinPath(quorumDir, 'genesis.json')
    const keyDir = joinPath(quorumDir, 'keystore')
    const passwordDestination = joinPath(keyDir, 'password.txt')
    const logs = joinPath('qdata', 'logs')
    const initCommand = `cd ${networkPath} && ${pathToQuorumBinary(config.network.quorumVersion)} --datadir ${quorumDir} init ${genesisLocation} 2>&1`
    initCommands.push(initCommand)

    const tmIpcLocation = isTessera(config.network.transactionManager)
      ? joinPath(tmDir, 'tm.ipc')
      : 'ignore'
    const startCommand = createGethStartCommand(
      config,
      node,
      passwordDestination,
      nodeNumber,
      tmIpcLocation,
    )
    startCommands.push(startCommand)

    if (isTessera(config.network.transactionManager)) {
      const tmStartCommand = createTesseraStartCommand(config, node, nodeNumber, tmDir, logs)
      tmStartCommands.push(tmStartCommand)
    }
  })

  const obj = {
    tesseraStart: tmStartCommands.join('\n'),
    gethStart: startCommands.join('\n'),
    initStart: initCommands,
  }
  return obj
}


export async function buildBash(config) {
  const bashDetails = buildBashScript(config)
  const networkPath = getFullNetworkPath(config)

  if (isCakeshop(config.network.cakeshop)) {
    buildCakeshopDir(config, joinPath(networkPath, 'qdata'))
  }

  info('Writing start script...')
  writeFile(joinPath(networkPath, 'start.sh'), bashDetails.startScript, true)
  copyFile(joinPath(libRootDir(), 'lib', 'stop.sh'), joinPath(networkPath, 'stop.sh'))

  info('Initializing quorum...')
  bashDetails.initCommands.forEach((command) => executeSync(command))
  info('Done')
}

export function createGethStartCommand(config, node, passwordDestination, nodeNumber, tmIpcPath) {
  const {
    verbosity, networkId, consensus, quorumVersion,
  } = config.network
  const {
    devP2pPort, rpcPort, raftPort, wsPort,
  } = node.quorum
  const quorum26Flags = isQuorum260Plus(quorumVersion) ? '--allow-insecure-unlock' : ''

  const args = `--nodiscover --rpc --rpccorsdomain=* --rpcvhosts=* --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,${consensus},quorumPermission --ws --wsaddr 0.0.0.0 --wsorigins=* --emitcheckpoints --unlock 0 --password ${passwordDestination} ${quorum26Flags}`
  const consensusArgs = isRaft(consensus)
    ? `--raft --raftport ${raftPort}`
    : '--istanbul.blockperiod 5 --syncmode full --mine --minerthreads 1'

  return `PRIVATE_CONFIG=${tmIpcPath} nohup $BIN_GETH --datadir qdata/dd${nodeNumber} ${args} ${consensusArgs} --permissioned --verbosity ${verbosity} --networkid ${networkId} --rpcport ${rpcPort} --wsport ${wsPort} --port ${devP2pPort} 2>>qdata/logs/${nodeNumber}.log &`
}

export function createTesseraStartCommand(config, node, nodeNumber, tmDir, logDir) {
  // `rm -f ${tmDir}/tm.ipc`

  let DEBUG = ''
  if (config.network.remoteDebug) {
    DEBUG = '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=500$i -Xdebug'
  }

  const MEMORY = '-Xms128M -Xmx128M'
  const CMD = `java ${DEBUG} ${MEMORY} -jar $BIN_TESSERA -configfile ${tmDir}/tessera-config-09-${nodeNumber}.json >> ${logDir}/tessera${nodeNumber}.log 2>&1 &`
  return CMD
}

function checkTesseraUpcheck(nodes) {
  return nodes.map((node, i) => `
    result${i + 1}=$(curl -s http://${node.tm.ip}:${node.tm.p2pPort}/upcheck)
    if [ ! "\${result${i + 1}}" == "I'm up!" ]; then
        echo "Node ${i + 1} is not yet listening on http"
        DOWN=true
    fi`)
}

export function setEnvironmentCommand(config) {
  const lines = []
  lines.push(`BIN_GETH=${pathToQuorumBinary(config.network.quorumVersion)}`)
  if (isTessera(config.network.transactionManager)) {
    lines.push(`BIN_TESSERA=${pathToTesseraJar(config.network.transactionManager)}`)
  }
  if (isCakeshop(config.network.cakeshop)) {
    lines.push(`BIN_CAKESHOP=${pathToCakeshop(config.network.cakeshop)}`)
  }
  lines.push('')
  return lines.join('\n')
}

export function waitForTesseraNodesCommand(config) {
  if (!isTessera(config.network.transactionManager)) {
    return ''
  }
  return `
echo "Waiting until all Tessera nodes are running..."
DOWN=true
k=10
while \${DOWN}; do
    sleep 1
    DOWN=false
    for i in \`seq 1 ${config.nodes.length}\`
    do
        if [ ! -S "qdata/c\${i}/tm.ipc" ]; then
            echo "Node \${i} is not yet listening on tm.ipc"
            DOWN=true
        fi
    done
    set +e
    #NOTE: if using https, change the scheme
    #NOTE: if using the IP whitelist, change the host to an allowed host
    ${checkTesseraUpcheck(config.nodes).join('')}

    k=$((k - 1))
    if [ \${k} -le 0 ]; then
        echo "Tessera is taking a long time to start.  Look at the Tessera logs in qdata/logs/ for help diagnosing the problem."
    fi
    echo "Waiting until all Tessera nodes are running..."

    sleep 5
done

echo "All Tessera nodes started"
`
}
