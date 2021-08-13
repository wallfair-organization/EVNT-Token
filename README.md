# EVNT-Token
The EVNT-Token is an ERC20-Token running on the Polygon Network.

## Installation

Clone the repository:

`git clone https://github.com/wallfair-organization/EVNT-Token.git`

Ensure you have node.js and npm installed:

```
sudo apt-get install nodejs npm
```

Then install the required packages for the Hardhat toolchain:

```
npm install ethers@^7.12.0 hardhat@^7.12.0 ethereum-waffle@^3.2.0 \
@nomiclabs/hardhat-waffle@^2.0.1 chai @nomiclabs/hardhat-web3 web3 \
@nomiclabs/hardhat-etherscan @nomiclabs/hardhat-ethers @openzeppelin/contracts \
@nomiclabs/hardhat-truffle5 hardhat-gas-reporter dotenv-safe
```

Hardhad should be configured, but if it isn't run the next line, create a sample project
and choose the default project root path.

`npx hardhat`

Then try compiling the contracts to see if it has all worked:

`npx hardhat compile`


## Paper
To learn more about the utility of the token, read the [litepaper](https://wallfair.io/static/media/wallfair-litepaper.00df42b3.pdf)
## Copyright 
2021 - Wallfair.
