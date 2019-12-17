export function generateConsensusConfig(consensus) {
  return consensus == `raft` ?  generateRaftConfig() : generateIstanbulConfig()
}

function generateRaftConfig() {

}

function generateIstanbulConfig() {

}
