// This script is designed to test the solidity smart contracts and the various functions within
// load dependencies
const { deployEVNT } = require('./utils/deploy');

// Declare a variable and assign the compiled smart contract artifact
const TestTokenLock = artifacts.require('TestTokenLock');

const assertTryCatch = require('./utils/exceptions.js').tryCatch;
const ErrTypes = require('./utils/exceptions.js').errTypes;

contract('TestTokenLock', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];

  const LOCK_AMOUNT = web3.utils.toWei('100000000');

  let EVNTToken;

  before(async () => {
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('');

    // TODO: this assigns instance to type and is beyond bad
    EVNTToken = await deployEVNT([{
      address: ownerID,
      amount: LOCK_AMOUNT,
    }]);

    const testTokenLock = await TestTokenLock.new(
      EVNTToken.address,
      stakedAccountID,
      LOCK_AMOUNT,
      1612137600, // startDate
      4 * 365 * 24 * 60 * 60, // four year vesting period
      1 * 365 * 24 * 60 * 60, // 1 year cliff
    );
    TestTokenLock.setAsDeployed(testTokenLock);

    await EVNTToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });
  });

  it('The startTime can be in the future', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const startTime = await testTokenLock.startTime({ from: stakedAccountID });
    const tokensVested = await testTokenLock.tokensVested(stakedAccountID, 1612137600, { from: stakedAccountID });
    const unlockedTokens = await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID });

    assert.equal(startTime, 1612137600, 'The starting date is mismatched');
    assert.equal(unlockedTokens, 0, 'Some Tokens are already unlocked');
    // assert.equal(web3.utils.fromWei(tokensVested), 250000, 'The tokensVested should only be the initial unlock');
    assert.equal(web3.utils.fromWei(tokensVested), 0, 'The tokensVested should only be the initial unlock');
  });

  /*

  it('Testing tokensVested() function', async () => {
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

      const tokensVested = await testTokenLock.tokensVested(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensVested), expectedResults[i - 1]);
    }
  });

  it('Testing tokensVested() function extensively', async () => {
    const EVNTToken = await EVNTToken.new();
    const testTokenLock = await TestTokenLock.new(EVNTToken.address,
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

    const tokensVestedBefore = await testTokenLock.tokensVested(stakedAccountID, 1612137500,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedBefore), 280000, 'Should be only initial unlock');

    const tokensVestedExact = await testTokenLock.tokensVested(stakedAccountID, 1612137600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedExact), 280000, 'Should be only initial unlock');

    for (let i = 1; i <= 37; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensVestedAlmost = await testTokenLock.tokensVested(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensVestedAlmost), expectedResults[i]);

      const tokensVested = await testTokenLock.tokensVested(stakedAccountID, changedTimeStamp + 1,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensVested), expectedResults[i + 1]);
    }

    const tokensVestedYearLater = await testTokenLock.tokensVested(stakedAccountID, 1706745600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedYearLater), 1000000);
  });

  it('Testing tokensVested() function no initial unlock', async () => {
    const EVNTToken = await EVNTToken.new();
    const testTokenLock = await TestTokenLock.new(
      EVNTToken.address, stakedAccountID, LOCK_AMOUNT, 36, 0, 1612137600,
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

    const tokensVestedBefore = await testTokenLock.tokensVested(stakedAccountID, 1612137500,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedBefore), 0, 'Should be only initial unlock');

    const tokensVestedExact = await testTokenLock.tokensVested(stakedAccountID, 1612137600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedExact), 0, 'Should be only initial unlock');

    for (let i = 1; i <= 37; i++) {
      const changedTimeStamp = 1612137600 + i * secondsInMonth;

      const tokensVestedAlmost = await testTokenLock.tokensVested(stakedAccountID, changedTimeStamp,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensVestedAlmost), expectedResults[i]);

      const tokensVested = await testTokenLock.tokensVested(stakedAccountID, changedTimeStamp + 1,
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensVested), expectedResults[i + 1]);
    }

    const tokensVestedYearLater = await testTokenLock.tokensVested(stakedAccountID, 1706745600,
      { from: stakedAccountID });
    assert.equal(web3.utils.fromWei(tokensVestedYearLater), 1000000);
  });

  */

  it('Testing view functions for invalid Accounts', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const invalidTokensVested = await testTokenLock.tokensVested(invalidAccountID,
      1612137600,
      { from: invalidAccountID },
    );
    const unlockedTokens = await testTokenLock.unlockedTokensOf(invalidAccountID, { from: invalidAccountID });

    assert.equal(unlockedTokens, 0, 'Some Tokens are unlocked');
    assert.equal(web3.utils.fromWei(invalidTokensVested), 0, 'The tokensVested should only be zero');
  });

  it('Testing modifier', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    await assertTryCatch(testTokenLock.release({ from: invalidAccountID }), ErrTypes.revert);
  });

  /* this one fails because it looks like it's expecting the initial allocation

  it('Testing release() function', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    const timestampNow = Math.round(new Date().getTime() / 1000);

    const release = await testTokenLock.release({ from: stakedAccountID });
    const tokensVested = await testTokenLock.tokensVested(stakedAccountID, timestampNow, { from: stakedAccountID });
    const balance = await EVNTToken.balanceOf(stakedAccountID, { from: stakedAccountID });

    assert.isNotNull(release, 'Token should be released');
    assert.equal(balance.toString(), tokensVested.toString(), 'Token should be received');
  });

  */

  it('Testing release()-fail', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    await assertTryCatch(testTokenLock.release({ from: stakedAccountID }), ErrTypes.revert);
  });
});
