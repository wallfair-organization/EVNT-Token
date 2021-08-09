const TestTokenLock = artifacts.require('TestTokenLock');
const WallfairToken = artifacts.require('WallfairToken');

module.exports = async function (deployer, network, accounts) {
  const WallfairTokenInstance = await WallfairToken.deployed();
  await deployer.deploy(TestTokenLock, WallfairTokenInstance.address, accounts[1], web3.utils.toWei("1000000"), 1250, 2500);
};
