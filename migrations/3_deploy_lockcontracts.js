const TestTokenLock = artifacts.require('TestTokenLock');
const EVNTToken = artifacts.require('EVNTToken');

module.exports = async function (deployer, network, accounts) {
  const EVNTTokenInstance = await EVNTToken.deployed();
  await deployer.deploy(TestTokenLock,
    EVNTTokenInstance.address, accounts[1], web3.utils.toWei('1000000'), 6, 1250, 1612137600);
};
