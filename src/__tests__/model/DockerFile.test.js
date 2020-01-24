import { buildDockerCompose } from '../../utils/dockerHelper'
import { createQuickstartConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft dockerFile tessera no cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose', false)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera no cakeshop', () => {
  const config = createQuickstartConfig('5', 'istanbul', 'none', 'docker-compose', false)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 3nodes raft dockerFile tessera cakeshop', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose', true)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera cakeshop', () => {
  const config = createQuickstartConfig('5', 'istanbul', 'none', 'docker-compose', true)
  const docker = buildDockerCompose(config)
  expect(docker).toMatchSnapshot()
})
