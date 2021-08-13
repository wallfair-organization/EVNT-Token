/* hardhat-deploy.config.js */
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
require('dotenv-safe').config();

const { 
    ROPSTEN_API_URL, 
    MAINNET_API_URL, 
    BINANCE_API_URL, 
    MUMBAI_API_URL,
    ROPSTEN_PRIVATE_KEY, 
    MAINNET_PRIVATE_KEY, 
    BINANCE_PRIVATE_KEY, 
    MUMBAI_PRIVATE_KEY, 
    ETHSCAN_API_KEY } = process.env;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    ropsten: {
         url: ROPSTEN_API_URL,
         accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
    },
    mainnet: {
        url: MAINNET_API_URL,
        accounts: [`0x${MAINNET_PRIVATE_KEY}`]
    },
    binancetest: {
        url: BINANCE_API_URL,
        chainId: 97,
        accounts: [`0x${BINANCE_PRIVATE_KEY}`]
    },
    mumbai: {
        url: MUMBAI_API_URL,
        accounts: [`0x${MUMBAI_PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: ETHSCAN_API_KEY
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
