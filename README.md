# EVNT-Token
[![Build](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml)
[![Wallfair. Smart Contract Test](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/pull_request.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/pull_request.yml)

The EVNT-Token is an ERC20-Token running on the Polygon Network.

## Installation

Clone the repository:

`git clone https://github.com/wallfair-organization/EVNT-Token.git`

Ensure you have node.js and npm installed:

```
sudo apt-get install nodejs npm
```

Then install the required packages for the Hardhat toolchain:

`npm install`

Hardhad should be configured, but if it isn't run the next line, create a sample project
and choose the default project root path.

`npx hardhat`

Then try compiling the contracts to see if it has all worked:

`npx hardhat compile`

## Network configuration

### For local development 
Create an empty `.env` file with `touch .env`.

By default `hardhat.config.js` is used when executing hardhat commands. It is configured to only
support the in-memory or local standalone network. If no network is specified, the in-memory 
network is used by default.

You can start a local standalone network with `npx hardhat node` and then run hardhat commands 
on it with the network option `--network localhost`

### For remote network deployment

For full deployment, you will need to correctly configure a `.env` file. See `.env.example` for the format,
and comment out any networks that you are not using.

Then run your harhat commands using the `config` option:

`npx hardhat <COMMAND> --config hardhat-deploy.config.js --network <NETWORK>`

Remember to be careful with your keys! Share your keys and you share your coins.


## Paper
To learn more about the utility of the token, read the [litepaper](https://wallfair.io/static/media/wallfair-litepaper.00df42b3.pdf)

## Copyright 
2021 - Wallfair.
