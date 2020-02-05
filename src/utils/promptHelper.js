const { Form } = require('enquirer')

export async function getPorts(numberNodes, deployment, hasTessera) {
  const nodes = []
  for (let i = 0; i < parseInt(numberNodes, 10); i++) {
    const quorumInfo = [
      {name: 'ip', message: 'ip', initial: deployment === 'docker-compose' ? `172.16.239.1${i+1}` : '127.0.0.1'},
      {name: 'devP2pPort', message: 'devP2pPort', initial: numToString(21000+i)},
      {name: 'rpcPort', message: 'rpcPort', initial: numToString(22000+i)},
      {name: 'wsPort', message: 'wsPort', initial: numToString(23000+i)},
      {name: 'raftPort', message: 'raftPort', initial: numToString(50401+i)}
    ]
    const tesseraInfo = [
        {name: 'ip', message: 'ip', initial: deployment === 'docker-compose' ? `172.16.239.10${i+1}` : '127.0.0.1'},
        {name: 'thirdPartyPort', message: 'thirdPartyPort', initial: numToString(9081+i)},
        {name: 'p2pPort', message: 'p2pPort', initial: numToString(9001+i)},
        {name: 'enclavePort', message: 'enclavePort', initial: numToString(9180+i)}
      ]
    const quorumPrompt = new Form({
      name: 'ports',
      message: `Provide the following port information for Quorum node ${i+1}`,
      choices: quorumInfo
    })
    let node = {}
    await quorumPrompt.run()
      .then(value => {
          node = {
            quorum: value
          }
      })
    const tesseraPrompt = new Form({
      name: 'ports',
      message: `Provide the following port information for Tessera node ${i+1}`,
      choices: tesseraInfo
    })
    await tesseraPrompt.run()
      .then(value => {
          node.tm = value
      })
      nodes.push(node)
  }
  return nodes
}

function numToString(num) {
  return num.toString()
}
