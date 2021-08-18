// This script is designed to test the solidity smart contracts and the various functions within
// load dependencies
const Math = require('mathjs');

const { expect } = require('chai');
const { web3, ethers } = require('hardhat');
const { deployEVNT } = require('./utils/deploy');
const { BN } = require('@openzeppelin/test-helpers');

// Declare a variable and assign the compiled smart contract artifact
const TestTokenLock = artifacts.require('TestTokenLock');
const TestTokenLockNoCliff = artifacts.require('TestTokenLockNoCliff');
const EVNTToken = artifacts.require('EVNTToken');

const assertTryCatch = require('./utils/exceptions.js').tryCatch;
const ErrTypes = require('./utils/exceptions.js').errTypes;

contract('TestTokenLock: views tests', function (accounts) {
  const ownerID = accounts[0];
  const stakedAccountID = accounts[1];
  const invalidAccountID = accounts[2];

  const MINT_AMOUNT = web3.utils.toWei('3000000');
  const LOCK_AMOUNT = web3.utils.toWei('1000000');
  const VESTING = 4 * 365 * 24 * 60 * 60;
  const CLIFF = 1 * 365 * 24 * 60 * 60;
  const START_DATE = 1612137600;

  let myEVNTToken;

  beforeEach(async () => {
    /*
    console.log('\n  ETH-Accounts used');
    console.log('  Contract Owner:  accounts[0] ', accounts[0]);
    console.log('  Staked Account:  accounts[1] ', accounts[1]);
    console.log('  Invalid Account: accounts[2] ', accounts[2]);
    console.log('');
    */

    // TODO: this assigns instance to type and is beyond bad
    myEVNTToken = await deployEVNT([{
      address: ownerID,
      amount: MINT_AMOUNT,
    }]);

    EVNTToken.setAsDeployed(myEVNTToken);

    const testTokenLock = await TestTokenLock.new(
      myEVNTToken.address,
      stakedAccountID,
      LOCK_AMOUNT,
      START_DATE,
      VESTING,
      CLIFF
    );
    TestTokenLock.setAsDeployed(testTokenLock);

    const testTokenLockNoCliff = await TestTokenLock.new(
      myEVNTToken.address,
      stakedAccountID,
      LOCK_AMOUNT,
      START_DATE,
      VESTING,
      0, // 0 year cliff
    );
    TestTokenLockNoCliff.setAsDeployed(testTokenLockNoCliff);

    // this is locking two amounts from the same owner in two different vesting locks
    await myEVNTToken.transfer(testTokenLock.address, LOCK_AMOUNT, { from: ownerID });
    await myEVNTToken.transfer(testTokenLockNoCliff.address, LOCK_AMOUNT, { from: ownerID });

  });

/*
 *
 * Individual tests start here 
 *
 */

  // Basic view tests

  it('Check token address is correct', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    const token = await EVNTToken.deployed();
    expect(await testTokenLock.token()).to.equal(token.address); 
  });

  it('Check startTime is as deployed', async () => {
    const testTokenLock = await TestTokenLock.deployed(); 
    expect(await testTokenLock.startTime()).to.be.a.bignumber.to.equal(new BN('1612137600'));
  });

  it('check vestingPeriod is as deployed', async () => {
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

  it('Check there are no unlocked tokens at the initial deployment', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.unlockedTokensOf(stakedAccountID, { from: stakedAccountID })).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('Check the initial vesting is 0', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    expect(await testTokenLock.tokensVested(stakedAccountID, 1612137600, { from: stakedAccountID })).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('Check cliff period has not been exceeded for TokenLock contract', async () => {
    const testTokenLock = await TestTokenLock.deployed();
    const block = await ethers.provider.getBlock('latest');
    expect(await testTokenLock.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('0'));
  });

  it('Check cliff period has been exceeded for TokenLockNoCliff contract', async () => {
    const testTokenLockNoCliff = await TestTokenLockNoCliff.deployed();
    const block = await ethers.provider.getBlock('latest');
    expect(await testTokenLockNoCliff.cliffExceeded(block.timestamp)).to.be.a.bignumber.to.equal(new BN('1'));
  });

  // tokensVested testing
  // testTokenLock has 4 year vesting with 1 year cliff
  // testTokenLock has 4 year vesting with no cliff

  it('Check no tokens are reported as vested in cliff period', async () => {
    const testTokenLockNoCliff = await TestTokenLock.deployed();
    for (let i = START_DATE; i < (START_DATE + CLIFF); i += (Math.randomInt(1, Math.floor(CLIFF/100)))) {
      expect(await testTokenLockNoCliff.tokensVested(stakedAccountID, i.toString())).to.be.a.bignumber.to.equal(new BN('0'));
    }
  });

  it('Check correct number of tokens are reported as vested after cliff period', async () => {
    const testTokenLockNoCliff = await TestTokenLock.deployed();
    let expected;
    const amount = new BN(LOCK_AMOUNT);
    for (let i = START_DATE + CLIFF; i < (START_DATE + VESTING); i += (Math.randomInt(1, Math.floor(VESTING/50)))) {
      console.log(amount.mul(new BN((i - START_DATE).toString())).div(new BN(VESTING.toString())).toString());
      expected = amount.mul(new BN((i - START_DATE).toString())).div(new BN(VESTING.toString()));
      expect(await testTokenLockNoCliff.tokensVested(stakedAccountID, i.toString())).to.be.a.bignumber.to.equal(expected);
    }
  });

});

