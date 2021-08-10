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

  const LOCK_AMOUNT = web3.utils.toWei('1000000');

  before(async () => {
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('  Future Account:  accounts[3] ', accounts[3]);
    console.log('');

    const testTokenLock = await TestTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    await wallfairToken.mint(LOCK_AMOUNT, { from: ownerID });
    await wallfairToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });
  });

  it('Testing view functions', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const startTime = await testTokenLock.startTime({ from: stakedAccountID });
    const tokensDue = await testTokenLock.tokensDue(stakedAccountID, 1612137600, { from: stakedAccountID });
    const unlockedTokens = await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID });

    assert.equal(startTime, 1612137600, 'The starting date is mismatched');
    assert.equal(unlockedTokens, 0, 'Some Tokens are already unlocked');
    // assert.equal(web3.utils.fromWei(tokensDue), 250000, 'The tokensDue should only be the initial unlock');
    assert.equal(web3.utils.fromWei(tokensDue), 125000, 'The tokensDue should only be the initial unlock');
  });

  it('Testing tokensDue() function', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const secondsInMonth = 30 * 86400;
    // const expectedResults = [250000, 375000, 500000, 625000, 750000, 875000, 1000000, 1000000];
    //                       Start                                           End      After
    const expectedResults = [
      125000,
      270833.333333333333333333,
      416666.666666666666666666,
      562500,
      708333.333333333333333333,
      854166.666666666666666666,
      1000000, 1000000];

    for (let i = 1; i <= 8; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensDue = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDue), expectedResults[i - 1]);
    }
  });

  it('Testing tokensDue() function extensively', async () => {
    const wallfairToken = await WallfairToken.new();
    const testTokenLock = await TestTokenLock.new(wallfairToken.address,
      stakedAccountID, LOCK_AMOUNT, 36, 2800, 1612137600,
    );

    const secondsInMonth = 30 * 86400;
    const expectedResults = [
      280000,
      280000,
      300000,
      320000,
      340000,
      360000,
      380000,
      400000,
      420000,
      440000,
      460000,
      480000,
      500000,
      520000,
      540000,
      560000,
      580000,
      600000,
      620000,
      640000,
      660000,
      680000,
      700000,
      720000,
      740000,
      760000,
      780000,
      800000,
      820000,
      840000,
      860000,
      880000,
      900000,
      920000,
      940000,
      960000,
      980000,
      1000000,
      1000000,
    ];

    const tokensDueBefore = await testTokenLock.tokensDue(stakedAccountID, 1612137500,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueBefore), 280000, 'Should be only initial unlock');

    const tokensDueExact = await testTokenLock.tokensDue(stakedAccountID, 1612137600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueExact), 280000, 'Should be only initial unlock');

    for (let i = 1; i <= 37; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensDueAlmost = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDueAlmost), expectedResults[i]);

      const tokensDue = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp + 1,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDue), expectedResults[i + 1]);
    }

    const tokensDueYearLater = await testTokenLock.tokensDue(stakedAccountID, 1706745600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueYearLater), 1000000);
  });

  it('Testing tokensDue() function no initial unlock', async () => {
    const wallfairToken = await WallfairToken.new();
    const testTokenLock = await TestTokenLock.new(
      wallfairToken.address, stakedAccountID, LOCK_AMOUNT, 36, 0, 1612137600,
    );

    const secondsInMonth = 30 * 86400;
    const expectedResults = [
      0,
      0,
      27777.777777777777777777,
      55555.555555555555555555,
      83333.333333333333333333,
      111111.111111111111111111,
      138888.888888888888888888,
      166666.666666666666666666,
      194444.444444444444444444,
      222222.222222222222222222,
      250000,
      277777.777777777777777777,
      305555.555555555555555555,
      333333.333333333333333333,
      361111.111111111111111111,
      388888.888888888888888888,
      416666.666666666666666666,
      444444.444444444444444444,
      472222.222222222222222222,
      500000,
      527777.777777777777777777,
      555555.555555555555555555,
      583333.333333333333333333,
      611111.111111111111111111,
      638888.888888888888888888,
      666666.666666666666666666,
      694444.444444444444444444,
      722222.222222222222222222,
      750000,
      777777.777777777777777777,
      805555.555555555555555555,
      833333.333333333333333333,
      861111.111111111111111111,
      888888.888888888888888888,
      916666.666666666666666666,
      944444.444444444444444444,
      972222.222222222222222222,
      1000000,
      1000000,
    ];

    const tokensDueBefore = await testTokenLock.tokensDue(stakedAccountID, 1612137500,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueBefore), 0, 'Should be only initial unlock');

    const tokensDueExact = await testTokenLock.tokensDue(stakedAccountID, 1612137600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueExact), 0, 'Should be only initial unlock');

    for (let i = 1; i <= 37; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensDueAlmost = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDueAlmost), expectedResults[i]);

      const tokensDue = await testTokenLock.tokensDue(stakedAccountID, changedTimeStamp + 1,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDue), expectedResults[i + 1]);
    }

    const tokensDueYearLater = await testTokenLock.tokensDue(stakedAccountID, 1706745600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensDueYearLater), 1000000);
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
    const wallfairToken = await WallfairToken.new();

    const timestampNow = Math.round(new Date().getTime() / 1000);
    const secondsInMonth = 30 * 86400;

    const testTokenLock = await TestTokenLock.new(wallfairToken.address,
      futureAccountID, LOCK_AMOUNT, 36, 0, timestampNow,
    );

    await wallfairToken.mint(LOCK_AMOUNT, { from: ownerID });
    await wallfairToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });

    for (let i = 1; i <= 37; i++) {
      const changedTimeStamp = timestampNow + i * secondsInMonth;

      if (i === 1) {
        await assertTryCatch(testTokenLock.release({ from: futureAccountID }), ErrTypes.revert);
      } else {
        const release = await testTokenLock.release({ from: futureAccountID });
        const balance = await wallfairToken.balanceOf(futureAccountID, { from: futureAccountID });

        assert.isNotNull(release, 'Token should be released');
        assert.equal(balance.toString(), tokensDue.toString(), 'Token should be received');
      }

      await increaseTime(secondsInMonth);

    }
  });

  it('Testing dateDiff() function', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const JAN = 1609459200; // 1. Jan 2021
    const FEB = 1612137600; // 1. Feb 2021
    const MAR = 1614729600; // 3. Mar 2021
    const APR = 1617321600; // 2. Apr 2021
    const monthDiff1 = await testTokenLock.monthDiff(JAN, FEB, { from: stakedAccountID });
    const monthDiff2 = await testTokenLock.monthDiff(JAN, MAR, { from: stakedAccountID });
    const monthDiff3 = await testTokenLock.monthDiff(JAN, APR, { from: stakedAccountID });

    assert.equal(monthDiff1, 1, '1 Month should be the difference');
    assert.equal(monthDiff2, 2, '2 Month should be the difference');
    assert.equal(monthDiff3, 3, '3 Month should be the difference');
  });
});
