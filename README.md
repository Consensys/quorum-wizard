![](https://github.com/jpmorganchase/quorum-wizard/workflows/Build%20&%20Test/badge.svg)
# GoQuorum Wizard

[GoQuorum Wizard](https://github.com/ConsenSys/quorum-wizard) is a command line tool that allows
users to set up a development GoQuorum network on their local machine in less than 2 minutes.

## ⚠️ Project Deprecation Notice ⚠️

quorum-wizard will be deprecated on December 31st 2021, date from when we will stop supporting the project.

From now on, we encourage all users to use to [quorum-dev-quickstart](https://github.com/ConsenSys/quorum-dev-quickstart) which is a similar tool offering extra compatibility with Quorum products, in particular Hyperledger Besu and Orchestrate.

We will continue to support quorum-wizard in particular fixing bugs until the end of 2021.

If you have any questions or concerns, please reach out to the ConsenSys protocol engineering team on [#Discord](https://chat.consensys.net) or by [email](mailto:quorum@consensys.net).

## Using GoQuorum Wizard

![](docs/quorum-wizard.gif)

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

The wizard provides the option to deploy some useful tools alongside your network. Learn more on the [Tools page](https://docs.goquorum.consensys.net/en/stable/HowTo/GetStarted/Wizard/Tools/).

## Developing
Clone this repo to your local machine.

`npm install` to get all the dependencies.

`npm run test:watch` to automatically run tests on changes

`npm run start` to automatically build on changes to any files in the src directory

`npm link` to use your development build when you run the global npm command

`quorum-wizard` to run (alternatively, you can run `node build/index.js`)

## Contributing
GoQuorum Wizard is built on open source and we invite you to contribute enhancements. Upon review you will be required to complete a Contributor License Agreement (CLA) before we are able to merge. If you have any questions about the contribution process, please feel free to send an email to [quorum@consensys.net](mailto:quorum@consensys.net).

## Getting Help
Stuck at some step? Please join our <a href="https://www.goquorum.com/slack-inviter" target="_blank" rel="noopener">Slack community</a> for support.
