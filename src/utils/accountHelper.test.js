import nodekeyToAccount from './accountHelper'

test('converts node key to ethereum address', () => {
  expect(nodekeyToAccount('0x1be3b50b31734be48452c29d714941ba165ef0cbf3ccea8ca16c45e3d8d45fb0'))
    .toEqual('0xd8Dba507e85F116b1f7e231cA8525fC9008A6966')
})
