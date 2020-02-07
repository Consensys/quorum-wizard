import { exec, execSync } from 'child_process'

export function execute (command, callback) {
  exec(command, (e, stdout, stderr) => {
    if (e instanceof Error) {
      console.error(e)
      throw e
    }
  })
}

export function executeSync(command, options) {
  return execSync(command, options)
}
