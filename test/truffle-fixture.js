const Migrations = artifacts.require('Migrations');

module.exports = async () => {
  const migrations = await Migrations.new();
  Migrations.setAsDeployed(migrations);
};


const WallfairToken = artifacts.require('WallfairToken');

module.exports = async () => {
  const wallfairToken = await WallfairToken.new();
  WallfairToken.setAsDeployed(wallfairToken);
};


const FriendsTokenLock = artifacts.require('FriendsTokenLock');

module.exports = async (network, accounts) => {
  const wallfairTokenInstance = await WallfairToken.deployed();
  console.log(wallfairTokenInstance.address);
  console.log(accounts[1])
  const friendsTokenLock = await FriendsTokenLock.new(wallfairTokenInstance.address, accounts[1]);
  FriendsTokenLock.setAsDeployed(friendsTokenLock);
};
