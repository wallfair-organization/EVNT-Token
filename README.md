
[![build](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml)
[![tests](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/tests.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/tests.yml)

# Contracts
## EVNTToken
The EVNTToken is an ERC20-Token with ERC1363 extentions. ERC20 implementation is provided by OpenZeppelin, ERC1363 extensions by https://github.com/vittominacori/erc1363-payable-token. Extensions allow the token (when one of the alternative `transfer` method is used) to inform the receiver, if it is a smart contract, on the transfer - similarly to the fallback function in case of native ETH.

Extensions are intendend to be used within Wallfair Platform ie. to stake tokens in the PLP contract without the need of additional `approve` transaction.

EVNTToken immediately mints the requested supply to the `msg.sender`. What happens afterwards - see *Deployment* section.

## TokenLock 

# Installation

Clone the repository:

`git clone https://github.com/wallfair-organization/EVNT-Token.git`

Ensure you have node.js and npm installed. You must be using **npm version >= 7**.

Then install the required packages for the Hardhat toolchain:

`npm install`

Hardhat should be configured, but if it isn't run the next line, create a sample project
and choose the default project root path.

`npx hardhat`

Then try compiling the contracts to see if it has all worked:

`npx hardhat compile`

# Testing
We use `Truffle` plugin to write tests.

# Coverage
We use solidity-coverage with `npm run hardhat:coverage`.

# Network configuration

## For local development 
Create an empty `.env` file with `touch .env`.

By default `hardhat.config.js` is used when executing hardhat commands. It is configured to only
support the in-memory or local standalone network. If no network is specified, the in-memory 
network is used by default.

You can start a local standalone network with `npx hardhat node` and then run hardhat commands 
on it with the network option `--network localhost`

## For remote network deployment

For full deployment, you will need to correctly configure a `.env` file. See `.env.example` for the format,
and comment out any networks that you are not using.

Then run your harhat commands using the `config` option:

`npx hardhat <COMMAND> --config hardhat-deploy.config.js --network <NETWORK>`

Remember to be careful with your keys! Share your keys and you share your coins.

# Deployment


# Paper
To learn more about the utility of the token, read the [litepaper](https://wallfair.io/static/media/wallfair-litepaper.00df42b3.pdf)

# Copyright 
© 2021 Wallfair.
