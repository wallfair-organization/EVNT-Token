
[![build](https://github.com/wallfair-organization/WFAIR-Token/actions/workflows/build.yml/badge.svg)](https://github.com/wallfair-organization/WFAIR-Token/actions/workflows/build.yml)
[![tests](https://github.com/wallfair-organization/WFAIR-Token/actions/workflows/tests.yml/badge.svg)](https://github.com/wallfair-organization/WFAIR-Token/actions/workflows/tests.yml)

# Contracts
## WFAIRToken
The `WFAIRToken` is an ERC20 token that uses ERC1363 extentions. The ERC20 implementation is provided by OpenZeppelin, and ERC1363 extensions are by https://github.com/vittominacori/erc1363-payable-token.

When a `transfer` method is used, the extensions allow the token to inform the receiver whether it is a smart contract on transfer, which provides similar functionality to the fallback function in the case of native ETH.

Extensions are intendend to be used within Wallfair Platform, that is, to stake tokens in the PLP contract without the need of an additional `approve` transaction.

The `WFAIRToken` contract immediately mints the requested supply to the `msg.sender`. For what happens after that see the *Deployment* section.

## TokenLock 
`TokenLock` implements simple vesting schedule. Within the contract we define a *vesting function* which, for a given total amount of tokens, tells how many of the tokens may be released at a given moment. This function is defined as follows:

1. It releases tokens linearly, proportional to the time elapsed from the *vesting start* timestamp. Effectively, it releases tokens block by block
2. It realeases tokens fully after the *vesting period* has elapsed, as measured from the *vesting start*.
3. A *cliff period* may be defined, which works as a standard vesting cliff. See https://www.investopedia.com/ask/answers/09/what-is-cliff-vesting.asp
4. An *initial release fraction* may be defined, which will release that fraction of the tokens immediately on *vesting start*

`TokenLock` fulfills several implementation requirements:

1. Only one vesting function may be defined per contract instance.
2. Tokens belonging to several addresses may be locked in single instance provided they have the same vesting schedule. Addresses may be simple addresses, or they can be contracts
3. A cliff and an initial release may not be defined together in single instance
4. *vesting start* may be specified to have happened in the past, or in the future in reference to the time of the deployment of the contract
5. The contract can be requested to execute a `transfer` function to the address defined as the owner, and it keeps track of how much was already released. The actual release therefore happens via an owner-executed transaction. The release will fail if the `TokenLock` does not held enough WFAIR tokens.
6. There are no methods to "reclaim" non-released tokens. Tokens that can't be released (if the owner lost the private key, for example) are locked forever.
7. All time periods must be multiples of 30 days.
8. A list of stakes (*owner address : total amount due* mapping) is provided at the deployment time, and cannot be changed later.

### Funding the Lock with tokens
`TokenLock` requires that the total amount of tokens passed to the constructor is owned by it, before the release function is available. For that a simple state machine is implemented:

1. The contract is in an `Initialized` state after deploymend, until the `fund` method is called
2. After `funded` method successfully completes, the state is changed to `Funded` and the `release` function is available to be called.

The actual funding may happen in three ways:

1. The required amount of tokens is transferred to the `TokenLock` instance before `fund` method is called. In that case the method just verifies the instance balance, and performs the state transition
2. The required amount of tokens is approved as per ERC20 to the `TokenLock` instance before `fund` method is called. In that case the contract will transfer the required amount to itself from the sender (msg.sender).
3. A mix of the above: only the amount missing will be required to be approved and later transferred.

The actual deployment requires several instances of the `TokenLock` to be created to cover all the vesting schedules Wallfair needs.

## Deployment
The deployment procedure is as follows:
1. `WFAIRToken` instance is deployed and the full supply is minted to `msg.sender` (`deployer`).
2. Several `TokenLock` instances are deployed, depending on the actual allocations and vesting schedules of Wallfair, and final lists of addresses are provided to those instances.
3. The `deployer` transfers the tokens it holds to the `TokenLock` instances (and other wallets if needed) - as per the Wallfair token allocation. At this point `deployer` will not hold any tokens and its private key may be destroyed.


# Installation

Clone the repository:

`git clone https://github.com/wallfair-organization/WFAIR-Token.git`

Ensure you have node.js and npm installed. You must be using **npm version >= 7**.

Then install the required packages for the Hardhat toolchain:

`npm install`

Next, try compiling the contracts to see if it has all worked:

`npx hardhat compile`

# Testing
We use the `Truffle` plugin to write tests. Tests can be run using:

`npm run test`

# Linting
We use `solhint` and `eslint` for linting. Relevant commands are `npm run lint`, `npm run lint:sol` and `npm run lint:js`.

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

For full deployment, you will need to correctly configure an `.env` file. See `.env.example` for the format.

Then run your Hardhat commands using the `config` option:

`npx hardhat <COMMAND> --config hardhat-deploy.config.js --network <NETWORK>`

Remember to be careful with your keys! Share your keys and you share your coins.

# Paper
To learn more about the utility of the token, read the [litepaper](https://wallfair.io/static/media/wallfair-litepaper.00df42b3.pdf).

# Copyright 
© 2021 Wallfair.
