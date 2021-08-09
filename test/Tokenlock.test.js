const TestTokenLock = artifacts.require('TestTokenLock');
const WallfairToken = artifacts.require('WallfairToken');

const assertTryCatch = require('./exceptions.js').tryCatch;
const ErrTypes = require('./exceptions.js').errTypes;

contract('TestTokenLock', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];

  before(async () => {
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('');

    const testTokenLock = await TestTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();

    await wallfairToken.mint(web3.utils.toWei('1000000'), { from: ownerID });
    await wallfairToken.transfer(testTokenLock.address, web3.utils.toWei('1000000'), { from: ownerID });
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
    const timeStamps =
        [1612137600, 1614556800, 1617235200, 1619827200, 1622505600, 1625097600, 1627776000, 1630454400];
    //      Feb.        Mar.        Apr.        May         June        July        Aug.        Sept.

    const expectedResults = [250000, 375000, 500000, 625000, 750000, 875000, 1000000, 1000000];
    //                       Start                                           End      After

    for (const timeStampIndex in timeStamps) {
      console.log(timeStamps[timeStampIndex]);
      const tokensDue = await testTokenLock.tokensDue(stakedAccountID, timeStamps[timeStampIndex],
        { from: stakedAccountID });
      assert.equal(web3.utils.fromWei(tokensDue), expectedResults[timeStampIndex],
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
});
