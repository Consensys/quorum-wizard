import 'source-map-support/register'
import inquirer from 'inquirer'
import { customize, quickstart } from './questions'
import { INITIAL_MODE } from './questions/questions'

inquirer.prompt([INITIAL_MODE])
.then(async ({ mode }) => {
  if (mode === 1) {
    await quickstart()
  } else if (mode === 2) {
    await customize()
  } else {
    console.log('Exiting...')
  }
})
