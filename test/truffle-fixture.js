const Migrations = artifacts.require('Migrations');
const WallfairToken = artifacts.require('WallfairToken');
const FriendsTokenLock = artifacts.require('FriendsTokenLock');

module.exports = async () => {
  const migrations = await Migrations.new();
  Migrations.setAsDeployed(migrations);

  const wallfairToken = await WallfairToken.new();
  WallfairToken.setAsDeployed(wallfairToken);

  const wallfairTokenInstance = await WallfairToken.deployed();
  const accounts = await ethers.getSigners();
  const friendsTokenLock = await FriendsTokenLock.new(wallfairTokenInstance.address, accounts[1].address);
  FriendsTokenLock.setAsDeployed(friendsTokenLock);
};
