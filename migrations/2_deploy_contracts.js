const WallfairToken = artifacts.require('WallfairToken');

module.exports = function (deployer) {
  deployer.deploy(WallfairToken);
};
