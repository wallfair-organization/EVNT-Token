const FriendsTokenlock = artifacts.require("FriendsTokenlock");
const WallfairToken = artifacts.require("WallfairToken");

module.exports = async function (deployer) {
    const WallfairTokenInstance = await WallfairToken.deployed();
    await deployer.deploy(FriendsTokenlock, WallfairTokenInstance.address);
};
