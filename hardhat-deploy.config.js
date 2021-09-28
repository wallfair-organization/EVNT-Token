/* hardhat-deploy.config.js */
require('@babel/register');
require('@babel/polyfill');
require('hardhat-gas-reporter');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-web3');
require('dotenv-safe').config();

const {
  RINKEBY_API_URL,
  GOERLI_API_URL,
  MAINNET_API_URL,
  MUMBAI_API_URL,
  MATIC_API_URL,
  RINKEBY_PRIVATE_KEY,
  GOERLI_PRIVATE_KEY,
  MAINNET_PRIVATE_KEY,
  MUMBAI_PRIVATE_KEY,
  MATIC_PRIVATE_KEY,
} = process.env;

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      // over-ride chain ID to allow MetaMask to connect to localhost:8545
      // see https://hardhat.org/metamask-issue.html
      chainId: 1337,
    },
    rinkeby: {
      url: RINKEBY_API_URL,
      chainId: 4,
      gas: 'auto',
      gasLimit: 2000000000, // 2 gwei
      accounts: [RINKEBY_PRIVATE_KEY],
    },
    goerli: {
      url: GOERLI_API_URL,
      chainId: 5,
      // gas: "auto",
      gasLimit: 1000000000, // 3 gwei
      accounts: [GOERLI_PRIVATE_KEY],
    },
    mainnet: {
      url: MAINNET_API_URL,
      chainId: 1,
      accounts: [MAINNET_PRIVATE_KEY],
    },
    mumbai: {
      url: MUMBAI_API_URL,
      accounts: [MUMBAI_PRIVATE_KEY],
    },
    matic: {
      url: MATIC_API_URL,
      accounts: [MATIC_PRIVATE_KEY],
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
