/* hardhat.config.js */
require('@babel/register');
require('@babel/polyfill');
require('chai/register-should');
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-web3');
require('solidity-coverage');
require('dotenv-safe').config({
  allowEmptyValues: true,
});

require('dotenv-safe').config();

const { LOCALHOST_PRIVATE_KEY, LOCALHOST_PRIVATE_KEY2 } = process.env;

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      // over-ride chain ID to allow MetaMask to connect to localhost:8545
      // see https://hardhat.org/metamask-issue.html
      chainId: 1337,
      accounts: [LOCALHOST_PRIVATE_KEY, LOCALHOST_PRIVATE_KEY2],
    },
    coverage: {
      url: 'http://127.0.0.1:8555',
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  solidity: {
    version: '0.8.7',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
