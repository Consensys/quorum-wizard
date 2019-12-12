const inquirer = require('inquirer')
const {
  INITIAL_MODE,
  NUMBER_NODES,
  CONSENSUS_MODE,
  DEPLOYMENT_TYPE
} = require('./questions')

let exitMessage = "Exiting..."

function start() {
  inquirer.prompt([INITIAL_MODE])
  .then(async ({ mode }) => {
    if (mode === 1) {
      await quickstart()
    } else if (mode === 2) {
      exitMessage = "Customize mode not yet supported"
    }
    console.log(exitMessage)
  })
}

async function quickstart () {
  const answers = await inquirer.prompt([
    NUMBER_NODES,
    CONSENSUS_MODE,
    DEPLOYMENT_TYPE
  ])
  console.log('Collected values from user: ', answers)
  exitMessage = 'To be continued...'
}

start()
