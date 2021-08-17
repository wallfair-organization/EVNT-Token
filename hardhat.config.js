/* hardhat.config.js */
require("@babel/register");
require("@babel/polyfill");
require('chai/register-should');
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
require('dotenv-safe').config({
  allowEmptyValues: true
});

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // over-ride chain ID to allow MetaMask to connect to localhost:8545
      // see https://hardhat.org/metamask-issue.html
      chainId: 1337
    }
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
