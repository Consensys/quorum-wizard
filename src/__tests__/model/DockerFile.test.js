import { buildDockerComposeWithTessera, buildDockerComposeNoTessera } from '../../utils/dockerHelper'
import { createQuickstartConfig } from '../../model/NetworkConfig'

test('creates 3nodes raft dockerFile tessera', () => {
  const config = createQuickstartConfig('3', 'raft', 'tessera', 'docker-compose')
  const docker = buildDockerComposeWithTessera(config)
  expect(docker).toMatchSnapshot()
})

test('creates 5nodes istanbul dockerFile no tessera', () => {
  const config = createQuickstartConfig('5', 'istanbul', 'none', 'docker-compose')
  const docker = buildDockerComposeNoTessera(config)
  expect(docker).toMatchSnapshot()
})
