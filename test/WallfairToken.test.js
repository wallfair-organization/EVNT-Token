const WallfairToken = artifacts.require('WallfairToken');

const assertTryCatch = require('./exceptions.js').tryCatch;
const ErrTypes = require('./exceptions.js').errTypes;

contract('WallfairToken', function (accounts) {
    const ownerID = accounts[0];

    before(() => {
        console.log('\n  ETH-Accounts used');
        console.log('  Contract Owner:  accounts[0] ', accounts[0]);
        console.log('');
    });

    it('Testing smart contract mint function', async () => {
        const wallfairToken = await WallfairToken.deployed();

        const mintValue = BigInt(1000000 * 10 ** 18);

        await wallfairToken.mint(mintValue, { from: ownerID });

        const balance = await wallfairToken.balanceOf(ownerID, { from: ownerID });

        assert.equal(balance, mintValue, 'The minted Amount is wrong');
    });

    it('Testing smart contract mint-fail function', async () => {
        const wallfairToken = await WallfairToken.deployed();

        const mintValue = BigInt(11000000000 * 10 ** 18);

        await assertTryCatch(wallfairToken.mint(mintValue, { from: ownerID }), ErrTypes.revert);
    });
});
