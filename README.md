![](https://github.com/jpmorganchase/quorum-wizard/workflows/Build%20&%20Test/badge.svg)
# GoQuorum Wizard

[GoQuorum Wizard](https://github.com/ConsenSys/quorum-wizard) is a command line tool that allows
users to set up a development GoQuorum network on their local machine in less than 2 minutes.

![](docs/quorum-wizard.gif)

## Using GoQuorum Wizard

GoQuorum Wizard is written in Javascript and designed to be run as a global NPM module from the command line. Make sure you have [Node.js/NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed (version 10 or higher).

Using npx to run the wizard without the need to install:

```
npx quorum-wizard
```

You can also install the wizard globally with npm:

```Bash
npm install -g quorum-wizard

# Once the global module is installed, run:
quorum-wizard
```

Note: Many installations of npm don't have permission to install global modules and will throw an EACCES error. [Here is the recommended solution from NPM](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

## Dependencies

Here are the dependencies (in addition to NodeJS 10+) that are required depending on the mode that you run the wizard in:

Bash:

- Java (when running Tessera and/or Cakeshop)

Docker Compose:

- Docker
- docker-compose

Kubernetes:

- Docker (for generating resources during network creation)
- kubectl
- minikube, Docker Desktop with Kubernetes enabled, or some other kubernetes context

## Options

You can also provide these flags when running quorum-wizard:

| Flags | Effect |
| - | - |
| `-q`, `--quickstart` | Create 3 node raft network with tessera and cakeshop (no user-input required) |
| `generate --config <PATH>` | Generate a network from an existing config.json file |
| `-r`, `--registry <REGISTRY>` | Use a custom docker registry (instead of registry.hub.docker.com) |
| `-o`, `--outputPath <PATH>` | Set the output path. Wizard will place all generated files into this folder. Defaults to the location where Wizard is run |
| `-v`, `--verbose` | Turn on additional logs for debugging |
| `--version` | Show version number |
| `-h`, `--help` | Show help |

## Interacting with the Network

To explore the features of GoQuorum and deploy a private contract, follow the instructions on [Interacting with the Network](https://docs.goquorum.consensys.net/en/stable/HowTo/GetStarted/Wizard/Interacting/).

## Tools

The wizard provides the option to deploy some useful tools alongside your network:

![Wizard Tools Selection](docs/WizardTools.png)

### Cakeshop

[Cakeshop](https://github.com/ConsenSys/cakeshop) is Quorum's official block explorer and node monitoring tool. You can use it to inspect blocks, deploy contracts, manage peers, and more.

Once you have selected this tool and started the network, it can be accessed at http://localhost:8999

### Reporting Tool

The [Reporting Tool](https://github.com/ConsenSys/quorum-reporting) provides convenient APIs for generating reports about contracts deployed to your network. Once a contract is registered, it is easy to inspect the transactions related to that contract and see how the state of the contract has changed over time.

Once you have selected this tool and started the network, the Reporting UI can be accessed at http://localhost:3000. The RPC API itself runs at http://localhost:4000.

### Splunk

[Splunk](https://splunk.com/) is a third-party monitoring solution that works with Quorum. If you add Splunk to your network (docker-compose only), all logs will be directed to the local Splunk container. From there, you can search through the logs, see network metrics, and create custom dashboards with the data that you are interested in.

Once you have selected this tool and started the network, the Splunk UI will be accessible at http://localhost:8000

### Prometheus

[Prometheus](https://prometheus.io) is a third-party metrics and monitoring solution that works with Quorum. If you add Prometheus to your network (kubernetes only), you will be able to see the Prometheus dashboard with charts for blocks/transactions per second, cpu and memory usage, network information, and more.

Once you have selected this tool and started the network, run the getEndpoints.sh script to get the endpoint for the Prometheus UI.

## Developing
Clone this repo to your local machine.

`npm install` to get all the dependencies.

`npm run test:watch` to automatically run tests on changes

`npm run start` to automatically build on changes to any files in the src directory

`npm link` to use your development build when you run the global npm command

`quorum-wizard` to run (alternatively, you can run `node build/index.js`)

## Contributing
GoQuorum Wizard is built on open source and we invite you to contribute enhancements. Upon review you will be required to complete a Contributor License Agreement (CLA) before we are able to merge. If you have any questions about the contribution process, please feel free to send an email to [info@goquorum.com](mailto:info@goquorum.com).

## Getting Help
Stuck at some step? Please join our <a href="https://www.goquorum.com/slack-inviter" target="_blank" rel="noopener">Slack community</a> for support.
