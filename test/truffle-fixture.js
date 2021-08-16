const { ethers } = require('hardhat');

const Migrations = artifacts.require('Migrations');
const WallfairToken = artifacts.require('WallfairToken');
const TestTokenLock = artifacts.require('TestTokenLock');

const LOCK_AMOUNT = web3.utils.toWei('1000000');

module.exports = async () => {
  const migrations = await Migrations.new();
  Migrations.setAsDeployed(migrations);

  const wallfairToken = await WallfairToken.new();
  WallfairToken.setAsDeployed(wallfairToken);

  const wallfairTokenInstance = await WallfairToken.deployed();
  const accounts = await ethers.getSigners();
  const testTokenLock = await TestTokenLock.new(
      wallfairTokenInstance.address, 
      accounts[1].address, 
      LOCK_AMOUNT, 
      6, 
      1250, 
      1612137600
  );
  TestTokenLock.setAsDeployed(testTokenLock);
};
