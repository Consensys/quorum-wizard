import inquirer from 'inquirer'
import { cidrhost } from '../utils/subnetUtils'

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
  questions.push({
    type: 'input',
    name: 'quorumGraphQl',
    message: `input quorum node ${i + 1} graphql port`,
    default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumGraphQl, 1) : '24000',
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
      name: 'tesseraP2P',
      message: `input tessera node ${i + 1} p2p port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tesseraP2P, 1) : '9001',
    })
    questions.push({
      type: 'input',
      name: 'tessera3Party',
      message: `input tessera node ${i + 1} third party port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tessera3Party, 1) : '9081',
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
        graphQlPort: answers.quorumGraphQl,
        raftPort: answers.quorumRaft === undefined ? incrementPort(50401, i) : answers.quorumRaft,
      },
    }
    if (hasTessera) {
      node.tm = {
        ip: answers.tesseraIP,
        p2pPort: answers.tesseraP2P,
        thirdPartyPort: answers.tessera3Party,
      }
    }
    nodes.push(node)
  }
  return nodes
}

function buildDockerQuestions(numberNodes, hasTessera, i, prevAnswers) {
  const questions = []
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
  questions.push({
    type: 'input',
    name: 'quorumGraphQl',
    message: `input quorum node ${i + 1} graphql port`,
    default: prevAnswers !== undefined ? incrementPort(prevAnswers.quorumGraphQl, 1) : '24000',
  })
  if (hasTessera) {
    questions.push({
      type: 'input',
      name: 'tessera3Party',
      message: `input tessera node ${i + 1} third party port`,
      default: prevAnswers !== undefined ? incrementPort(prevAnswers.tessera3Party, 1) : '9081',
    })
  }
  return questions
}

export async function getCustomizedDockerPorts(numberNodes, hasTessera, dockerSubnet) {
  let answers
  const nodes = []
  const devP2pPort = 21000
  const raftPort = 50401
  const p2pPort = 9001

  // eslint-disable no-await-in-loop
  for (let i = 0; i < parseInt(numberNodes, 10); i += 1) {
    answers = await inquirer.prompt(buildDockerQuestions(numberNodes, hasTessera, i, answers))
    const node = {
      quorum: {
        ip: cidrhost(dockerSubnet, i + 1 + 10),
        devP2pPort: numToString(devP2pPort + i),
        rpcPort: answers.quorumRpc,
        wsPort: answers.quorumWs,
        graphQlPort: answers.quorumGraphQl,
        raftPort: numToString(raftPort + i),
      },
    }
    if (hasTessera) {
      node.tm = {
        ip: cidrhost(dockerSubnet, i + 1 + 100),
        thirdPartyPort: answers.tessera3Party,
        p2pPort: numToString(p2pPort + i),
      }
    }
    nodes.push(node)
  }
  return nodes
}

export async function getCustomizedCakeshopPort() {
  const question = {
    type: 'input',
    name: 'cakeshopPort',
    message: 'input cakeshop port',
    default: '8999',
  }
  const answer = await inquirer.prompt(question)

  return answer.cakeshopPort
}

function numToString(num) {
  return num.toString()
}

function incrementPort(num, i) {
  return numToString(parseInt(num, 10) + i)
}
