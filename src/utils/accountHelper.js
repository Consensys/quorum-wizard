import { Wallet } from 'ethers'

export default function nodekeyToAccount(nodekey) {
  return new Wallet(nodekey).address
}
