// This script is designed to test the solidity smart contracts and the various functions within
// Declare a variable and assign the compiled smart contract artifact

const TestTokenLock = artifacts.require('TestTokenLock');
const WallfairToken = artifacts.require('WallfairToken');

const increaseTime = require("./utils/increaseTime").increaseTime;
const assertTryCatch = require('./exceptions.js').tryCatch;
const increaseTime = require('./utils/increaseTime').increaseTime;
const ErrTypes = require('./exceptions.js').errTypes;

contract('TestTokenLock', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];
  const futureAccountID = accounts[3];

  before(async () => {
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('  Future Account:  accounts[3] ', accounts[3]);
    console.log('');

    const testTokenLock = await TestTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    await wallfairToken.mint(web3.utils.toWei("1000000"), { from: ownerID });
    await wallfairToken.transfer(testTokenLock.address, web3.utils.toWei("1000000"), { from: ownerID });
  });

  it('Testing view functions', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const startTime = await testTokenLock.startTime({ from: stakedAccountID });
    const tokensDue = await testTokenLock.tokensDue(stakedAccountID, 1612137600, { from: stakedAccountID });
    const unlockedTokens = await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID });

    assert.equal(startTime, 1612137600, 'The starting date is mismatched');
    assert.equal(unlockedTokens, 0, 'Some Tokens are already unlocked');
    assert.equal(web3.utils.fromWei(tokensDue), 250000, 'The tokensDue should only be the initial unlock');
  });

  it('Testing tokensDue() function', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const secondsInMonth = 30 * 86400;
    const expectedResults = [250000, 375000, 500000, 625000, 750000, 875000, 1000000, 1000000];
    //                       Start                                           End      After

    for (let i = 1; i <= 8; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensDue = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDue), expectedResults[i - 1],
        'The tokensDue should only be the initial unlock');
    }
  });

  it('Testing view functions for invalid Accounts', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const invalidTokensDue = await testTokenLock.tokensDue(invalidAccountID, 1612137600, { from: invalidAccountID });
    const unlockedTokens = await testTokenLock.unlockedTokensOf(invalidAccountID, { from: invalidAccountID });

    assert.equal(unlockedTokens, 0, 'Some Tokens are unlocked');
    assert.equal(web3.utils.fromWei(invalidTokensDue), 0, 'The tokensDue should only be zero');
  });

  it('Testing modifier', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    await assertTryCatch(testTokenLock.release({ from: invalidAccountID }), ErrTypes.revert);
  });

  it('Testing release() function', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    const timestampNow = Math.round(new Date().getTime() / 1000);

    const release = await testTokenLock.release({ from: stakedAccountID });
    const tokensDue = await testTokenLock.tokensDue(stakedAccountID, timestampNow, { from: stakedAccountID });
    const balance = await wallfairToken.balanceOf(stakedAccountID, { from: stakedAccountID });

    assert.isNotNull(release, 'Token should be released');
    assert.equal(balance.toString(), tokensDue.toString(), 'Token should be received');
  });

  it('Testing release()-fail', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    await assertTryCatch(testTokenLock.release({ from: stakedAccountID }), ErrTypes.revert);
  });

  it('Testing dateDiff() function', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    const JAN = 1609459200; // 1. Jan 2021
    const FEB = 1612137600; // 1. Feb 2021
    const MAR = 1614729600; // 3. Mar 2021
    const APR = 1617321600; // 2. Apr 2021
    const monthDiff1 = await friendsTokenLock.monthDiff(JAN, FEB, { from: stakedAccountID });
    const monthDiff2 = await friendsTokenLock.monthDiff(JAN, MAR, { from: stakedAccountID });
    const monthDiff3 = await friendsTokenLock.monthDiff(JAN, APR, { from: stakedAccountID });

    assert.equal(monthDiff1, 1, '1 Month should be the difference');
    assert.equal(monthDiff2, 2, '2 Month should be the difference');
    assert.equal(monthDiff3, 3, '3 Month should be the difference');

  it('Testing with Time Travel', async () => {
    const wallfairToken = await WallfairToken.deployed();

    const timestampNow = Math.round(new Date().getTime() / 1000);
    const lockAmount = web3.utils.toWei('1000000');
    const secondsInMonth = 30 * 86400;

    const testTokenLock = await TestTokenLock.new(wallfairToken.address,
      futureAccountID, lockAmount, 200, 2800, timestampNow,
    );

    await wallfairToken.mint(lockAmount, { from: ownerID });
    await wallfairToken.transfer(testTokenLock.address, lockAmount, { from: ownerID });

    for (let i = 1; i <= 36; i++) {
      const changedTimeStamp = timestampNow + i * secondsInMonth;

      const release = await testTokenLock.release({ from: futureAccountID });
      const tokensDue = await testTokenLock.tokensDue(futureAccountID, changedTimeStamp, { from: futureAccountID });
      const balance = await wallfairToken.balanceOf(futureAccountID, { from: futureAccountID });

      await increaseTime(secondsInMonth);

      console.log(i, web3.utils.fromWei(balance), web3.utils.fromWei(tokensDue))

      assert.isNotNull(release, 'Token should be released');
      assert.equal(balance.toString(), tokensDue.toString(), 'Token should be received');
    }
  });

  it('Testing dateDiff() function', async () => {
    const friendsTokenLock = await FriendsTokenLock.deployed();

    const JAN = 1609459200; // 1. Jan 2021
    const FEB = 1612137600; // 1. Feb 2021
    const MAR = 1614729600; // 3. Mar 2021
    const APR = 1617321600; // 2. Apr 2021
    const monthDiff1 = await friendsTokenLock.monthDiff(JAN, FEB, { from: stakedAccountID });
    const monthDiff2 = await friendsTokenLock.monthDiff(JAN, MAR, { from: stakedAccountID });
    const monthDiff3 = await friendsTokenLock.monthDiff(JAN, APR, { from: stakedAccountID });

    assert.equal(monthDiff1, 1, '1 Month should be the difference');
    assert.equal(monthDiff2, 2, '2 Month should be the difference');
    assert.equal(monthDiff3, 3, '3 Month should be the difference');
  });
});
