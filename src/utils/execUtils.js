import {
  exec,
  execSync,
} from 'child_process'

export function execute(command, callback) {
  exec(command, callback)
}

export function executeSync(command, options) {
  return execSync(command, options)
}
