import { exec } from 'child_process'

export function execute (command, callback) {
  exec(command, (e, stdout, stderr) => {
    if (e instanceof Error) {
      console.error(e)
      throw e
    }
  })
}
