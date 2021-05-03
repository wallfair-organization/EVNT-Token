const FriendsTokenLock = artifacts.require("FriendsTokenLock");
const WallfairToken = artifacts.require("WallfairToken");

module.exports = async function (deployer) {
    const WallfairTokenInstance = await WallfairToken.deployed();
    await deployer.deploy(FriendsTokenLock, WallfairTokenInstance.address);
};
