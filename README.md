
[![build](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/build.yml)
[![tests](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/tests.yml/badge.svg)](https://github.com/wallfair-organization/EVNT-Token/actions/workflows/tests.yml)

# Contracts
## EVNTToken
The EVNTToken is an ERC20 token that uses ERC1363 extentions. The ERC20 implementation is provided by OpenZeppelin, and ERC1363 extensions by https://github.com/vittominacori/erc1363-payable-token.

When a `transfer` methods is used, the extensions allow the token to inform the receiver whether it is a smart contract on transfer, which provides similar functionality to the fallback function in the case of native ETH.

Extensions are intendend to be used within Wallfair Platform, that is, to stake tokens in the PLP contract without the need of an additional `approve` transaction.

The EVNTToken contract immediately mints the requested supply to the `msg.sender`. For what happens after that - see the *Deployment* section.

## TokenLock 

# Installation

Clone the repository:

`git clone https://github.com/wallfair-organization/EVNT-Token.git`

Ensure you have node.js and npm installed. You must be using **npm version >= 7**.

Then install the required packages for the Hardhat toolchain:

`npm install`

Then try compiling the contracts to see if it has all worked:

`npx hardhat compile`

# Testing
We use the `Truffle` plugin to write tests. Tests can be run using:

`npm run test`

# Coverage
We use solidity-coverage with `npm run hardhat:coverage`.

# Network configuration

## For local development 
Create an empty `.env` file with `touch .env`.

By default `hardhat.config.js` is used when executing Hardhat commands. It is configured to only
support the in-memory or local standalone network. If no network is specified, the in-memory 
network is used by default.

You can start a local standalone network with `npx hardhat node` and then run Hardhat commands 
on it with the network option `--network localhost`.

## For remote network deployment

For full deployment, you will need to correctly configure a `.env` file. See `.env.example` for the format,
and comment out any networks that you are not using.

Then run your Hardhat commands using the `config` option:

`npx hardhat <COMMAND> --config hardhat-deploy.config.js --network <NETWORK>`

Remember to be careful with your keys! Share your keys and you share your coins.

# Deployment


# Paper
To learn more about the utility of the token, read the [litepaper](https://wallfair.io/static/media/wallfair-litepaper.00df42b3.pdf).

# Copyright 
© 2021 Wallfair.
