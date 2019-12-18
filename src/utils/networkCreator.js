import { join, normalize } from 'path'
import { execute } from './execUtils'
import sanitize from 'sanitize-filename'
import {
  copyFile,
  createFolder,
  readFileToString,
  removeFolder,
  writeFile,
  writeJsonFile
} from './fileUtils'
import { generateKeys } from './keyGen'
import { generateConsensusConfig } from '../model/ConsensusConfig'
import { createConfig } from '../model/TesseraConfig'

export function createNetwork (config) {
  // https://nodejs.org/en/knowledge/file-system/security/introduction/
  const networkFolderName = sanitize(config.network.name)
  if (networkFolderName === '') {
    throw new Error('Network name was empty or contained invalid characters')
  }

  const networkPath = join(process.cwd(), 'network', networkFolderName)
  removeFolder(networkPath)

  const qdata = join(networkPath, 'qdata')
  const logs = join(qdata, 'logs')
  createFolder(logs, true)
  writeJsonFile(networkPath, 'config.json', config)

  const configPath = join(process.cwd(), config.network.configDir)
  if(config.network.generateKeys) {
      generateKeys(config, configPath)
      generateConsensusConfig(configPath, config.network.consensus, config.nodes)
  }

  const staticNodes = createStaticNodes(config.nodes, config.network.consensus, config.network.configDir)
  const peerList = createPeerList(config.nodes, config.network.transactionManager)
  const initCommands = []
  const startCommands = []
  const tmStartCommands = []
  const examplesPath = join(process.cwd(), '7nodes')

  config.nodes.forEach((node, i) => {
    const nodeNumber = i + 1
    const keyFolder = join(configPath, `key${nodeNumber}`)
    const quorumDir = join(qdata, `dd${nodeNumber}`)
    const gethDir = join(quorumDir, 'geth')
    const keyDir = join(quorumDir, 'keystore')
    const tmDir = join(qdata, `c${nodeNumber}`)
    const passwordDestination = join(keyDir, 'password.txt')
    const genesisDestination = join(quorumDir, `${config.network.consensus}-genesis.json`)
    createFolder(quorumDir)
    createFolder(gethDir)
    createFolder(keyDir)
    createFolder(tmDir)

    writeJsonFile(quorumDir, 'permissioned-nodes.json', staticNodes)
    writeJsonFile(quorumDir, 'static-nodes.json', staticNodes)
    copyFile(normalize(config.network.genesisFile), genesisDestination)
    copyFile(join(keyFolder, 'key'), join(keyDir, 'key'))
    copyFile(join(keyFolder, 'nodekey'), join(gethDir, 'nodekey'))
    copyFile(join(keyFolder, 'password.txt'), passwordDestination)
    copyFile(join(configPath, `${config.network.consensus}-genesis.json`), genesisDestination)
    if(isTessera(config)) {
      copyFile(join(keyFolder, 'tm.key'), join(tmDir, 'tm.key'))
      copyFile(join(keyFolder, 'tm.pub'), join(tmDir, 'tm.pub'))
      let tesseraConfig = createConfig(tmDir, nodeNumber,
        node.tm.thirdPartyPort, node.tm.p2pPort, peerList)
      writeJsonFile(tmDir, `tessera-config-09-${nodeNumber}.json`,
        tesseraConfig)
    }

    const initCommand = `cd ${networkPath} && geth --datadir ${quorumDir} init ${genesisDestination}`
    initCommands.push(initCommand)

    let tmIpcLocation = isTessera(config) ? join(tmDir, 'tm.ipc') : 'ignore'
    const startCommand = createGethStartCommand(config, node,
      passwordDestination, nodeNumber, tmIpcLocation)
    startCommands.push(startCommand)

    if (isTessera(config)) {
      const tmStartCommand = createTesseraStartCommand(config, node, nodeNumber,
        tmDir, logs)
      tmStartCommands.push(tmStartCommand)
    }
  })

  const waitForTmCommands = tmStartCommands.length === 0 ? ''
    : waitForTesseraNodesCommand(config.nodes.length)
  const startScript = [
    ...tmStartCommands,
    waitForTmCommands,
    ...startCommands,
  ]
  writeFile(join(networkPath, 'start.sh'), startScript.join('\n'), true)
  copyFile(join(process.cwd(), 'lib/stop.sh'), join(networkPath, 'stop.sh'))

  // initialize all the nodes
  initCommands.forEach((command) => {
    // TODO figure out the safest way to run shell commands
    execute(command, (e, stdout, stderr) => {
      if (e instanceof Error) {
        console.error(e)
        throw e
      }
    })
  })
}

export function createStaticNodes (nodes, consensus, configDir) {
  return nodes.map((node, i) => {
    const nodeNumber = i + 1
    const generatedKeyFolder = `${configDir}/key${nodeNumber}`
    const enodeId = readFileToString(join(generatedKeyFolder, 'enode'))

    let enodeAddress = `enode://${enodeId}@${node.quorum.ip}:${node.quorum.devP2pPort}?discport=0`
    if (consensus === 'raft') {
      enodeAddress += `&raftport=${node.quorum.raftPort}`
    }
    return enodeAddress
  })
}

function isTessera (config) {
  return config.network.transactionManager === 'tessera'
}

function createPeerList (nodes, transactionManager) {
  if (transactionManager !== 'tessera') {
    return []
  }
  return nodes.map((node) => ({
    url: `http://127.0.0.1:${node.tm.p2pPort}`
  }))
}

function createGethStartCommand (config, node, passwordDestination, nodeNumber, tmIpcLocation) {
  const { verbosity, id, consensus } = config.network
  const { devP2pPort, rpcPort, wsPort, raftPort } = node.quorum

  const args = `--nodiscover --rpc --rpccorsdomain=* --rpcvhosts=* --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,${consensus},quorumPermission --emitcheckpoints --unlock 0 --password ${passwordDestination}`
  const consensusArgs = consensus === 'raft' ?
    `--raft --raftport ${raftPort}` :
    `--istanbul.blockperiod 5 --syncmode full --mine --minerthreads 1`

  return `PRIVATE_CONFIG=${tmIpcLocation} nohup geth --datadir qdata/dd${nodeNumber} ${args} ${consensusArgs} --permissioned --verbosity ${verbosity} --networkid ${id} --rpcport ${rpcPort} --port ${devP2pPort} 2>>qdata/logs/${nodeNumber}.log &`
}

function createTesseraStartCommand (config, node, nodeNumber, tmDir, logDir) {
  // `rm -f ${tmDir}/tm.ipc`

  const tesseraJar = '$TESSERA_JAR' // require env variable to be set for now
  let DEBUG = ''
  if (config.network.remoteDebug) {
    DEBUG = '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=500$i -Xdebug'
  }

  const MEMORY = '-Xms128M -Xmx128M'
  const CMD = `java ${DEBUG} ${MEMORY} -jar ${tesseraJar} -configfile ${tmDir}/tessera-config-09-${nodeNumber}.json >> ${logDir}/tessera${nodeNumber}.log 2>&1 &`
  return CMD
}

function waitForTesseraNodesCommand (numberNodes) {
  // TODO use config values
  return `
echo "Waiting until all Tessera nodes are running..."
DOWN=true
k=10
while \${DOWN}; do
    sleep 1
    DOWN=false
    for i in \`seq 1 ${numberNodes}\`
    do
        if [ ! -S "qdata/c\${i}/tm.ipc" ]; then
            echo "Node \${i} is not yet listening on tm.ipc"
            DOWN=true
        fi

        set +e
        #NOTE: if using https, change the scheme
        #NOTE: if using the IP whitelist, change the host to an allowed host
        result=$(curl -s http://localhost:900\${i}/upcheck)
        set -e
        if [ ! "\${result}" == "I'm up!" ]; then
            echo "Node \${i} is not yet listening on http"
            DOWN=true
        fi
    done

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

