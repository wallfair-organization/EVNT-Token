// This script is designed to test the solidity smart contracts and the various functions within
// load dependencies
const { expect } = require('chai');
const { deployEVNT } = require('./utils/deploy');
const { BN } = require('@openzeppelin/test-helpers');

// Declare a variable and assign the compiled smart contract artifact
const TestTokenLock = artifacts.require('TestTokenLock');
const TestTokenLockNoCliff = artifacts.require('TestTokenLockNoCliff');

const assertTryCatch = require('./utils/exceptions.js').tryCatch;
const ErrTypes = require('./utils/exceptions.js').errTypes;

contract('TestTokenLock', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];

  const LOCK_AMOUNT = web3.utils.toWei('1000000');

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
      1612137600,  // startDate
      4 * 365 * 24 * 60 * 60, // four year vesting period
      1 * 365 * 24 * 60 * 60, // 1 year cliff
    );
    TestTokenLock.setAsDeployed(testTokenLock);

    const testTokenLockNoCliff = await TestTokenLock.new(
      EVNTToken.address,
      stakedAccountID,
      LOCK_AMOUNT,
      1612137600,  // startDate
      4 * 365 * 24 * 60 * 60, // four year vesting period
      0, // 0 year cliff
    );
    TestTokenLockNoCliff.setAsDeployed(testTokenLockNoCliff);

    await EVNTToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });
  });

/*
 *
 * Individual tests start here 
 *
 */

  // Basic view tests

  it('check token address is correct', async () => {
    const testTokenLock = await TestTokenLock.deployed();

    expect(await testTokenLock.token()).to.equal(wallfairToken.address); 
  });

  it('check startTime is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed(); 
    expect(await testTokenLock.startTime()).to.be.a.bignumber.to.equal(new BN('1612137600'));
  });

  it('check vestingPeriod is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.vestingPeriod()).to.be.a.bignumber.to.equal(new BN((4 * 365 * 24 * 60 * 60).toString()));
  });

  it('check cliffPeriod is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.cliffPeriod()).to.be.a.bignumber.to.equal(new BN((1 * 365 * 24 * 60 * 60).toString()));
  });

  it('check totalTokensOf are as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.totalTokensOf(stakedAccountID)).to.be.a.bignumber.to.equal((LOCK_AMOUNT).toString());
  });

  it('check the initial vesting is 0', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.tokensVested(stakedAccountID, 1612137600, { from: stakedAccountID })).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('check there are no unlocked tokens at the initial deployment', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect((await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID })).toString()).to.equal('0');
  });

  it('check cliff period has not been exceeded for TokenLock contract', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    block = await ethers.provider.getBlock('latest');
    expect(await testTokenLock.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('check cliff period has been exceeded for TokenLockNoCliff contract', async () => {
    const testTokenLockNoCliff = await TestTokenLockNoCliff.deployed();
    block = await ethers.provider.getBlock('latest');
    expect(await testTokenLockNoCliff.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('1'));
  });

  // tokensVested takes an address and a timestamp as an input, so is a bit more complicated


});
