// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
const FriendsTokenlock = artifacts.require('FriendsTokenlock');
const WallfairToken = artifacts.require('WallfairToken');

contract('FriendsTokenlock', function (accounts) {

    const ownerID = accounts[0];

    ///Available Accounts
    ///==================
    ///(0) 0x27d8d15cbc94527cadf5ec14b69519ae23288b95
    ///(1) 0x018c2dabef4904ecbd7118350a0c54dbeae3549a
    ///(2) 0xce5144391b4ab80668965f2cc4f2cc102380ef0a
    ///(3) 0x460c31107dd048e34971e57da2f99f659add4f02
    ///(4) 0xd37b7b8c62be2fdde8daa9816483aebdbd356088
    ///(5) 0x27f184bdc0e7a931b507ddd689d76dba10514bcb
    ///(6) 0xfe0df793060c49edca5ac9c104dd8e3375349978
    ///(7) 0xbd58a85c96cc6727859d853086fe8560bc137632
    ///(8) 0xe07b5ee5f738b2f87f88b99aac9c64ff1e0c7917
    ///(9) 0xbd3ff2e3aded055244d66544c9c059fa0851da44

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

    it("Testing smart contract release() function", async () => {
        const friendsTokenlock = await FriendsTokenlock.deployed();
        const wallfairToken = await WallfairToken.deployed();

        const release = await friendsTokenlock.release({from: accounts[1]});
        const balance = await wallfairToken.balanceOf(accounts[1], {from: accounts[1]});

        assert.isNotNull(release, 'Token should be released');
        assert.isAbove(parseInt(balance), 0, 'Token should be received');
    });
});
