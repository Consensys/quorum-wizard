import { createQuickstartConfig } from '../../model/NetworkConfig'
import { generateCakeshopConfig } from '../../model/CakeshopConfig'

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose', true)
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'istanbul', 'tessera', 'bash', true)
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile no tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'none', 'docker-compose', true)
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})

test('creates 3nodes istanbul bash no tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'istanbul', 'none', 'bash', true)
  const cakeshop = generateCakeshopConfig(config)
  expect(cakeshop).toMatchSnapshot()
})
