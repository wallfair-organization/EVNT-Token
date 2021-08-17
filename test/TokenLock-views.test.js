// This script is designed to test the solidity smart contracts and the various functions within
// load dependencies
const { expect } = require('chai');
const { BN } = require('@openzeppelin/test-helpers');

// Declare a variable and assign the compiled smart contract artifact
const TestTokenLock = artifacts.require('TestTokenLock');
const TestTokenLockNoCliff = artifacts.require('TestTokenLockNoCliff');
const WallfairToken = artifacts.require('WallfairToken');

const assertTryCatch = require('./utils/exceptions.js').tryCatch;
const ErrTypes = require('./utils/exceptions.js').errTypes;

contract('TestTokenLock', function (accounts) {
  console.log('View Functions Test Cases');
  console.log('-------------------------');
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

    const testTokenLock = await TestTokenLock.deployed();
    const testTokenLockNoCliff = await TestTokenLockNoCliff.deployed();   
    const wallfairToken = await WallfairToken.deployed();

    // Two test contracts, so mint twice the amount
    await wallfairToken.mint(LOCK_AMOUNT, { from: ownerID });
    await wallfairToken.mint(LOCK_AMOUNT, { from: ownerID });
    // Transfer lock amount to first contract
    await wallfairToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });
    // Transfer lock amount to second contract
    await wallfairToken.transfer(testTokenLockNoCliff.address, LOCK_AMOUNT, { from: ownerID });
  });

/*
 *
 * Individual tests start here 
 *
 */

  // Basic view tests

  it('Check token address is correct', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    const wallfairToken = await WallfairToken.deployed();
    expect(await testTokenLock.token()).to.equal(wallfairToken.address); 
  });

  it('Check startTime is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed(); 
    expect(await testTokenLock.startTime()).to.be.a.bignumber.to.equal(new BN('1612137600'));
  });

  it('Check vestingPeriod is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.vestingPeriod()).to.be.a.bignumber.to.equal(new BN((4 * 365 * 24 * 60 * 60).toString()));
  });

  it('Check cliffPeriod is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.cliffPeriod()).to.be.a.bignumber.to.equal(new BN((1 * 365 * 24 * 60 * 60).toString()));
  });

  it('Check totalTokensOf are as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.totalTokensOf(stakedAccountID)).to.be.a.bignumber.to.equal((LOCK_AMOUNT).toString());
  });

  it('Check the initial vesting is 0', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.tokensVested(stakedAccountID, 1612137600, { from: stakedAccountID })).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('Check there are no unlocked tokens at the initial deployment', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect((await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID })).toString()).to.equal('0');
  });

  it('Check cliff period has not been exceeded for TokenLock contract', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    block = await ethers.provider.getBlock('latest');
    expect(await testTokenLock.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('Check cliff period has been exceeded for TokenLockNoCliff contract', async () => {
    const testTokenLockNoCliff = await TestTokenLockNoCliff.deployed();
    block = await ethers.provider.getBlock('latest');
    expect(await testTokenLock.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('1'));
  });

  // tokensVested takes an address and a timestamp as an input, so is a bit more complicated


});
