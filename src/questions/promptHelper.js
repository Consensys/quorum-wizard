const { Form } = require('enquirer')

export async function getCustomizedBashNodes(numberNodes, hasTessera) {
  const nodes = []
  for (let i = 0; i < parseInt(numberNodes, 10); i += 1) {
    const quorumInfo = [
      { name: 'ip', message: 'ip', initial: '127.0.0.1' },
      { name: 'devP2pPort', message: 'devP2pPort', initial: numToString(21000 + i) },
      { name: 'rpcPort', message: 'rpcPort', initial: numToString(22000 + i) },
      { name: 'wsPort', message: 'wsPort', initial: numToString(23000 + i) },
      { name: 'raftPort', message: 'raftPort', initial: numToString(50401 + i) },
    ]
    const tesseraInfo = [
      { name: 'ip', message: 'ip', initial: '127.0.0.1' },
      { name: 'thirdPartyPort', message: 'thirdPartyPort', initial: numToString(9081 + i) },
      { name: 'p2pPort', message: 'p2pPort', initial: numToString(9001 + i) },
      { name: 'enclavePort', message: 'enclavePort', initial: numToString(9180 + i) },
    ]
    const quorumPrompt = new Form({
      name: 'ports',
      message: `Provide the following port information for Quorum node ${i + 1}`,
      choices: quorumInfo,
    })
    let node = {}
    // eslint-disable-next-line no-await-in-loop
    await quorumPrompt.run()
      .then((value) => {
        node = {
          quorum: value,
        }
      })
    if (hasTessera) {
      const tesseraPrompt = new Form({
        name: 'ports',
        message: `Provide the following port information for Tessera node ${i + 1}`,
        choices: tesseraInfo,
      })
      // eslint-disable-next-line no-await-in-loop
      await tesseraPrompt.run()
        .then((value) => {
          node.tm = value
        })
    }
    nodes.push(node)
  }
  return nodes
}

export async function getCustomizedDockerPorts(hasTessera) {
  let customDocker = {}
  const quorumInfo = [
    { name: 'quorumRpcPort', message: 'quorumRpcPort', initial: '21000' },
    { name: 'quorumRaftPort', message: 'quorumRaftPort', initial: '50400' },
  ]
  const tesseraInfo = [
    { name: 'tesseraThirdPartyPort', message: 'tesseraThirdPartyPort', initial: '9080' },
    { name: 'tesseraP2pPort', message: 'tesseraP2pPort', initial: '9000' },
  ]
  const dockerPrompt = new Form({
    name: 'ports',
    message: 'Provide the following port information for docker configuration',
    choices: hasTessera ? quorumInfo.concat(tesseraInfo) : quorumInfo,
  })
  await dockerPrompt.run()
    .then((value) => {
      customDocker = value
    })
  return customDocker
}

function numToString(num) {
  return num.toString()
}
