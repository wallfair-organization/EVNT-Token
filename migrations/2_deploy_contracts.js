const EVNTToken = artifacts.require('EVNTToken');

module.exports = function (deployer) {
  deployer.deploy(EVNTToken);
};
