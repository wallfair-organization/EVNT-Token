const EVNTIcoToken = artifacts.require("EVNTIcoToken");

module.exports = function (deployer) {
    deployer.deploy(EVNTIcoToken);
};
