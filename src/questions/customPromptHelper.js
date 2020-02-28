import inquirer from 'inquirer'

function buildBashQuestions(numberNodes, hasTessera, i, prevAnswers, isRaft) {
  const questions = []
  questions.push({
    type: 'input',
    name: 'quorumIP',
    message: `input quorum node ${i + 1} ip`,
    default: prevAnswers !== undefined ? prevAnswers.quorumIP : '127.0.0.1',
  })
  questions.push({
    type: 'input',
    name: 'quorumP2P',
    message: `input quorum node ${i + 1} p2p port`,
    default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumP2P, 1) : '21000',
  })
  questions.push({
    type: 'input',
    name: 'quorumRpc',
    message: `input quorum node ${i + 1} rpc port`,
    default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumRpc, 1) : '22000',
  })
  questions.push({
    type: 'input',
    name: 'quorumWs',
    message: `input quorum node ${i + 1} ws port`,
    default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumWs, 1) : '23000',
  })
  if (isRaft) {
    questions.push({
      type: 'input',
      name: 'quorumRaft',
      message: `input quorum node ${i + 1} raft port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumRaft, 1) : '50401',
    })
  }

  if (hasTessera) {
    questions.push({
      type: 'input',
      name: 'tesseraIP',
      message: `input tessera node ${i + 1} ip`,
      default: prevAnswers !== undefined ? prevAnswers.tesseraIP : '127.0.0.1',
    })
    questions.push({
      type: 'input',
      name: 'tessera3Party',
      message: `input tessera node ${i + 1} third party port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tessera3Party, 1) : '9081',
    })
    questions.push({
      type: 'input',
      name: 'tesseraP2P',
      message: `input tessera node ${i + 1} p2p port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tesseraP2P, 1) : '9001',
    })
    questions.push({
      type: 'input',
      name: 'tesseraEnclave',
      message: `input tessera node ${i + 1} enclave port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tesseraEnclave, 1) : '9180',
    })
  }
  return questions
}


export async function getCustomizedBashNodes(numberNodes, hasTessera, isRaft) {
  let answers
  const nodes = []
  // eslint-disable no-await-in-loop
  for (let i = 0; i < parseInt(numberNodes, 10); i += 1) {
    answers = await inquirer.prompt(buildBashQuestions(numberNodes, hasTessera, i, answers, isRaft))
    const node = {
      quorum: {
        ip: answers.quorumIP,
        devP2pPort: answers.quorumP2P,
        rpcPort: answers.quorumRpc,
        wsPort: answers.quorumWs,
        raftPort: answers.quorumRaft === undefined ? incrementPort(50401, i) : answers.quorumRaft,
      },
    }
    if (hasTessera) {
      node.tm = {
        ip: answers.tesseraIP,
        thirdPartyPort: answers.tessera3Party,
        p2pPort: answers.tesseraP2P,
        enclavePort: answers.tesseraEnclave,
      }
    }
    nodes.push(node)
  }
  return nodes
}

export async function getCustomizedDockerPorts(hasTessera, isRaft) {
  const questions = []
  let customDocker = {}
  questions.push({
    type: 'input',
    name: 'quorumRpcPort',
    message: 'input quorum rpc port',
    default: '21000',
  })
  if (isRaft) {
    questions.push({
      type: 'input',
      name: 'quorumRaftPort',
      message: 'input quorum raft port',
      default: '50400',
    })
  }
  if (hasTessera) {
    questions.push({
      type: 'input',
      name: 'tesseraThirdPartyPort',
      message: 'input tessera third party port',
      default: '9080',
    })
    questions.push({
      type: 'input',
      name: 'tesseraP2pPort',
      message: 'input tessera third p2p port',
      default: '9000',
    })
  }
  const answers = await inquirer.prompt(questions)
  customDocker = {
    ...answers,
    quorumRaftPort: answers.quorumRaftPort === undefined ? '50400' : answers.quorumRaftPort,
  }
  return customDocker
}

function numToString(num) {
  return num.toString()
}

function incrementPort(num, i) {
  return numToString(parseInt(num, 10) + i)
}
