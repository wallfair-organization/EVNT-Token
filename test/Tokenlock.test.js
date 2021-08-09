const FriendsTokenLock = artifacts.require('FriendsTokenLock');
const WallfairToken = artifacts.require('WallfairToken');

const assertTryCatch = require('./exceptions.js').tryCatch;
const ErrTypes = require('./exceptions.js').errTypes;

contract('FriendsTokenLock', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];

  before(async () => {
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('');

    const friendsTokenLock = await FriendsTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    await wallfairToken.mint(BigInt(1000000 * 10 ** 18), { from: ownerID });
    await wallfairToken.transfer(friendsTokenLock.address, BigInt(1000000 * 10 ** 18), { from: ownerID });
  });

  it('Testing view functions', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    const startTime = await friendsTokenLock.startTime({ from: stakedAccountID });
    const tokensDue = await friendsTokenLock.tokensDue(stakedAccountID, 1612137600, { from: stakedAccountID });
    const unlockedTokens = await friendsTokenLock.unlockedTokens(stakedAccountID, { from: stakedAccountID });

    assert.equal(startTime, 1612137600, 'The starting date is mismatched');
    assert.equal(unlockedTokens, 0, 'Some Tokens are already unlocked');
    assert.equal(web3.utils.fromWei(tokensDue), 300000, 'The tokensDue should only be the initial unlock');
  });

  it('Testing view functions for invalid Accounts', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    const invalidTokensDue = await friendsTokenLock.tokensDue(invalidAccountID, 1612137600, { from: invalidAccountID });
    const unlockedTokens = await friendsTokenLock.unlockedTokens(invalidAccountID, { from: invalidAccountID });

    assert.equal(unlockedTokens, 0, 'Some Tokens are unlocked');
    assert.equal(web3.utils.fromWei(invalidTokensDue), 0, 'The tokensDue should only be zero');
  });

  it('Testing modifier', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    await assertTryCatch(friendsTokenLock.release({ from: invalidAccountID }), ErrTypes.revert);
  });

  it('Testing release() function', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    const timestampNow = Math.round(new Date().getTime() / 1000);

    const release = await friendsTokenLock.release({ from: stakedAccountID });
    const tokensDue = await friendsTokenLock.tokensDue(stakedAccountID, timestampNow, { from: stakedAccountID });
    const balance = await wallfairToken.balanceOf(stakedAccountID, { from: stakedAccountID });

    assert.isNotNull(release, 'Token should be released');
    assert.equal(balance.toString(), tokensDue.toString(), 'Token should be received');
  });

  it('Testing smart contract release()-fail', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    await assertTryCatch(friendsTokenLock.release({ from: stakedAccountID }), ErrTypes.revert);
  });
});
