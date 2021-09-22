import { deployWFAIR, deployLeaverTokenLock } from './utils/deploy';
import { Q18, WFAIR_TOTAL_SUPPLY, ZERO, DAYS_30 } from './utils/consts';
import { BN, expectRevert, time, expectEvent } from '@openzeppelin/test-helpers';
import { LockState } from './utils/state';
import { expect } from 'hardhat';
import { web3 } from '@openzeppelin/test-helpers/src/setup';
const Math = require('mathjs');

const LeaverTokenLock = artifacts.require('LeaverTokenLock');

contract('TokenLock', function ([deployer, manager, ...accounts]) {
  const stakedAccountID = accounts[1];

  // use some odd lock amount so any rounding errors will come out
  const LOCK_AMOUNT = (new BN('1000000')).mul(Q18).add(new BN(1));
  // VESTING AND CLIFF must be divisible by 30 days
  const VESTING = new BN(4 * 360 * 24 * 60 * 60);
  const START_DATE = new BN(1612137600);

  const BAD_LEAVER_PAST_PENALTY = 10;
  const GOD_LEAVER_FUTURE_PENALTY = 2;

  let WFAIRToken;

  async function newTokenLock (stakes, options) {
    const lockOpts = Object.assign(
      { startDate: START_DATE, vesting: VESTING },
      options || {},
    );
    const lock = await deployLeaverTokenLock(WFAIRToken.address,
      ...Object.values(lockOpts),
      manager,
      stakes,
    );
    // get events generated in constructor
    lock.receipt = await web3.eth.getTransactionReceipt(lock.transactionHash);
    lock.receipt.logs = await lock.getPastEvents();
    return lock;
  }

  beforeEach(async () => {
    WFAIRToken = await deployWFAIR(WFAIR_TOTAL_SUPPLY, deployer);
  });

  describe('Should deploy', () => {
    it('and have getters set', async () => {
      // deploy without stakes just to check view functions
      const lock = await newTokenLock([]);
      expect(await lock.token()).to.equal(WFAIRToken.address);
      expect(await lock.startTime()).to.be.a.bignumber.to.equal(START_DATE);
      expect(await lock.vestingPeriod()).to.be.a.bignumber.to.equal(VESTING);
      expect(await lock.cliffPeriod()).to.be.a.bignumber.to.equal(ZERO);
      expect(await lock.initialReleaseFraction()).to.be.a.bignumber.to.equal(ZERO);
      expect(await lock.totalLockedTokens()).to.be.a.bignumber.to.equal(ZERO);
      expect(await lock.state()).to.be.a.bignumber.to.equal(new BN(LockState.Initialized));
      expect(await lock.managerAddress()).to.be.a.bignumber.to.equal(manager);

      expectEvent(lock.receipt, 'LogInitialized', { totalLockedAmount: ZERO });
    });
  });

  describe('Should accumulate tokens', () => {
    let lock;

    beforeEach(async () => {
      lock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }]);
    });

    it('before and after start of release', async () => {
      // at vestingStart half should accumulate
      const halfAcc = await lock.tokensAccumulated(stakedAccountID, START_DATE);
      expect(halfAcc).to.be.bignumber.eq(LOCK_AMOUNT.divn(2));
      // zero at the beginning
      const begAcc = await lock.tokensAccumulated(stakedAccountID, START_DATE.sub(VESTING));
      expect(begAcc).to.be.bignumber.eq(ZERO);
      // full at the end
      const fullAcc = await lock.tokensAccumulated(stakedAccountID, START_DATE.add(VESTING));
      expect(fullAcc).to.be.bignumber.eq(LOCK_AMOUNT);
      // vested tokens unlock what accumulate accumulated
      for (let i = START_DATE.toNumber(); i < START_DATE.add(VESTING).toNumber();
        i += (Math.randomInt(1, Math.floor(VESTING.toNumber() / 50)))) {
        // use tested tokensVested from base class as reference
        const expected = await lock.tokensVested(stakedAccountID, i.toString());
        // transform domain
        const acc_i = i - VESTING.toNumber();
        // transform value - see sims in docs
        const actual = (await lock.tokensAccumulated(stakedAccountID, acc_i.toString())).muln(2);
        // rounding
        expect(actual.sub(expected).abs()).to.be.a.bignumber.lte(new BN(1));
      }
    });

    it('before and after the accumulation period', async () => {
      // zero before the beginning
      const begAcc = await lock.tokensAccumulated(stakedAccountID, START_DATE.sub(VESTING).sub(VESTING));
      expect(begAcc).to.be.bignumber.eq(ZERO);
      // full at the end
      const fullAcc = await lock.tokensAccumulated(stakedAccountID, START_DATE.add(VESTING).add(VESTING));
      expect(fullAcc).to.be.bignumber.eq(LOCK_AMOUNT);
    });

    it('zero for no stake', async () => {
      const halfAcc = await lock.tokensAccumulated(accounts[2], START_DATE);
      expect(halfAcc).to.be.bignumber.eq(ZERO);
      const begAcc = await lock.tokensAccumulated(accounts[2], START_DATE.sub(VESTING));
      expect(begAcc).to.be.bignumber.eq(ZERO);
      const fullAcc = await lock.tokensAccumulated(accounts[2], START_DATE.add(VESTING));
      expect(fullAcc).to.be.bignumber.eq(ZERO);
    });
  });

  describe.only('Should leave', () => {
    // let lock;

    async function lockWithFund (startDate, vestingPeriod) {
      const lock = await newTokenLock(
        [{ address: stakedAccountID, amount: LOCK_AMOUNT }],
        { startDate, vesting: vestingPeriod },
      );
        // send tokens to lock contract
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      await lock.fund();

      return lock;
    }

    async function expectTokenBalance (owner, expectedBalance) {
      expect(await WFAIRToken.balanceOf(owner)).to.be.bignumber.eq(expectedBalance);
    }

    describe('manager to reposses stake', () => {
      it('of bad leaver before unlock', async () => {
        const vestingPeriod = DAYS_30.muln(12);
        const initialTs = await time.latest();
        // unlock starts in 30 days
        const startDate = DAYS_30.add(initialTs);
        const lock = await lockWithFund(startDate, vestingPeriod);

        // leave 30 days before unlock starts so in 11/24 of acc period
        // the actual leave will happen one block ahead so add it in advance
        const expectedStake = (await lock.tokensAccumulated(stakedAccountID, initialTs.addn(4))).divn(BAD_LEAVER_PAST_PENALTY);
        const tx = await lock.leaveWallet(stakedAccountID, true, { from: manager });
        // new stake is accumulated value * 10%
        expectEvent(tx, 'LogLeave', { leaver: stakedAccountID, leaverType: '2', newTotalStake: expectedStake });
        expect(await lock.totalTokensOf(stakedAccountID)).to.be.bignumber.eq(expectedStake);
        // and the rest is shifted to manager
        expect(await lock.totalTokensOf(manager)).to.be.bignumber.eq(LOCK_AMOUNT.sub(expectedStake));
        // actually calc the value (use addn because a few blocks has passed)
        const calcNewStake = LOCK_AMOUNT.mul(DAYS_30.muln(11).addn(4)).div(DAYS_30.muln(24)).divn(BAD_LEAVER_PAST_PENALTY);
        expect(expectedStake).to.be.bignumber.eq(calcNewStake);
        // now claim in the future
        await time.increaseTo(startDate.add(vestingPeriod.divn(2)));
        await lock.release({ from: stakedAccountID });
        await time.increaseTo(startDate.add(vestingPeriod));
        await lock.release({ from: stakedAccountID });
        await lock.release({ from: manager });
        // check end token balances
        await expectTokenBalance(stakedAccountID, expectedStake);
        await expectTokenBalance(manager, LOCK_AMOUNT.sub(expectedStake));
        await expectTokenBalance(lock.address, ZERO);
      });
    });
  });
});
