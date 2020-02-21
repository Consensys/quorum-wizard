#!/usr/bin/env node

import 'source-map-support/register'
import inquirer from 'inquirer'
import { info } from './utils/log'
import {
  customize,
  quickstart,
  replica7Nodes,
} from './questions'
import { INITIAL_MODE } from './questions/questions'

inquirer.prompt([INITIAL_MODE])
  .then(async ({ mode }) => {
    if (mode === 1) {
      await quickstart()
    } else if (mode === 2) {
      await replica7Nodes()
    } else if (mode === 3) {
      await customize()
    } else {
      info('Exiting...')
    }
  })
