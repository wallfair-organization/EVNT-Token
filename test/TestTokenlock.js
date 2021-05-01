// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
const FriendsTokenlock = artifacts.require('FriendsTokenlock');
const WallfairToken = artifacts.require('WallfairToken');

const assertTryCatch = require("./exceptions.js").tryCatch;
const ErrTypes = require("./exceptions.js").errTypes;

contract('FriendsTokenlock', function (accounts) {

    const ownerID = accounts[0];

    console.log("ganache-cli accounts used here...");
    console.log("Contract Owner: accounts[0] ", ownerID);

    // Setup Roles for testing
    before(async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();
        const wallfairToken = await WallfairToken.deployed();

        await wallfairToken.mint(BigInt(1000000000 * (1 ** 18)),{from: ownerID});
        await wallfairToken.transfer(friendsTokenlock.address, BigInt(1000000000 * (1 ** 18)), {from: ownerID});
    });

    it("Testing smart contract view functions", async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();

        const startTime = await friendsTokenlock.startTime({from: accounts[1]});
        const unlockedMonths = await friendsTokenlock.unlockedMonths({from: accounts[1]});
        const unlockableMonths = await friendsTokenlock.unlockableMonths({from: accounts[1]});

        assert.equal(startTime, 1612137600, 'The starting date is mismatched');
        assert.equal(unlockedMonths, 0, 'Some Tokens are already unlocked');
        assert.isAbove(parseInt(unlockableMonths), 0, 'It should be larger than 0');
    });

    it("Testing smart contract modifiers", async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();
        await assertTryCatch(friendsTokenlock.unlockPortion({from: accounts[2]}), ErrTypes.revert);

        await assertTryCatch(friendsTokenlock.unlockedMonths({from: accounts[2]}), ErrTypes.revert);

        await assertTryCatch(friendsTokenlock.unlockableMonths({from: accounts[2]}), ErrTypes.revert);

        await assertTryCatch(friendsTokenlock.release({from: accounts[2]}), ErrTypes.revert);
    });

    it("Testing smart contract release() function", async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();
        const wallfairToken = await WallfairToken.deployed();

        const release = await friendsTokenlock.release({from: accounts[1]});
        const balance = await wallfairToken.balanceOf(accounts[1], {from: accounts[1]});

        assert.isNotNull(release, 'Token should be released');
        assert.isAbove(parseInt(balance), 0, 'Token should be received');
    });

    it("Testing smart contract release()-fail function", async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();

        await assertTryCatch(friendsTokenlock.release({from: accounts[1]}), ErrTypes.revert);
    });
});
