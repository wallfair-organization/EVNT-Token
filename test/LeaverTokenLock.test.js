import { deployWFAIR, deployLeaverTokenLock } from './utils/deploy';
import { Q18, WFAIR_TOTAL_SUPPLY, ZERO, DAYS_30, ARITH_REV_MSG } from './utils/consts';
import { BN, expectRevert, time, expectEvent } from '@openzeppelin/test-helpers';
import { LockState } from './utils/state';
import { LeaverType } from './utils/leaverType';
import { expect } from 'hardhat';
import { web3 } from '@openzeppelin/test-helpers/src/setup';
const Math = require('mathjs');

contract('LeaverTokenLock', function ([deployer, manager, ...accounts]) {
  const stakedAccountID = accounts[1];

  // use some odd lock amount so any rounding errors will come out
  const LOCK_AMOUNT = (new BN('1000000')).mul(Q18).add(new BN(1));
  // VESTING AND CLIFF must be divisible by 30 days
  const VESTING = new BN(4 * 360 * 24 * 60 * 60);
  const START_DATE = new BN(1612137600);

  const BAD_LEAVER_DIVISOR = 10;
  const GOD_LEAVER_DIVISOR = 2;

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
        const accI = i - VESTING.toNumber();
        // transform value - see sims in docs
        const actual = (await lock.tokensAccumulated(stakedAccountID, accI.toString())).muln(2);
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

  describe('Should leave', () => {
    const vestingPeriod = DAYS_30.muln(12);

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
      describe('before unlock', () => {
        // number of blocks shifted between start of the test and deployment of all contracts
        const testBlockDiff = 4;

        async function expectLeaverScenarioBeforeUnlock (
          startDateDelta,
          calcNewStake,
          isBadLeaver,
          wallet = stakedAccountID,
          lockAmount = LOCK_AMOUNT,
          finalLockBalance = ZERO) {
          const initialTs = await time.latest();
          const startDate = startDateDelta.add(initialTs);
          const lock = await lockWithFund(startDate, vestingPeriod);
          // the actual leave will happen few blocsk ahead so add it in advance
          const accumulated = await lock.tokensAccumulated(wallet, initialTs.addn(testBlockDiff));
          let expectedStake;
          if (isBadLeaver) {
            expectedStake = accumulated.divn(BAD_LEAVER_DIVISOR);
          } else {
            expectedStake = accumulated.add(lockAmount.sub(accumulated).divn(GOD_LEAVER_DIVISOR));
          }
          expect(expectedStake).to.bignumber.eq(calcNewStake);

          // not yet leaved
          expect(await lock.hasLeaved(wallet)).to.be.bignumber.eq(ZERO);
          const tx = await lock.leaveWallet(wallet, isBadLeaver, { from: manager });
          const expectedLeaverType = isBadLeaver ? new BN(LeaverType.BadLeaver) : new BN(LeaverType.GoodLeaver);
          expectEvent(tx, 'LogLeave', { leaver: wallet, leaverType: expectedLeaverType, newTotalStake: calcNewStake });
          expect(await lock.totalTokensOf(wallet)).to.be.bignumber.eq(calcNewStake);
          // and the rest is shifted to manager
          expect(await lock.totalTokensOf(manager)).to.be.bignumber.eq(lockAmount.sub(calcNewStake));
          // has leaved
          expect(await lock.hasLeaved(wallet)).to.be.bignumber.eq(expectedLeaverType);
          // now claim in the future
          await time.increaseTo(startDate.add(vestingPeriod.divn(2)));
          await lock.release({ from: wallet });
          await time.increaseTo(startDate.add(vestingPeriod));
          await lock.release({ from: wallet });
          await lock.release({ from: manager });
          // check end token balances
          await expectTokenBalance(wallet, calcNewStake);
          await expectTokenBalance(manager, lockAmount.sub(calcNewStake));
          // in all cases except unlocking empty wallet finalLockBalance == ZERO
          await expectTokenBalance(lock.address, finalLockBalance);
        }

        it('of bad leaver month before', async () => {
        // leave 30 days before unlock starts so in 11/24 of acc period
        // actually calc the value (use addn 4 because a few blocks has passed till moment of measure)
          const calcNewStake = LOCK_AMOUNT.mul(
            DAYS_30.muln(11).addn(testBlockDiff)).div(vestingPeriod.muln(2)).divn(BAD_LEAVER_DIVISOR,
          );
          await expectLeaverScenarioBeforeUnlock(DAYS_30, calcNewStake, true);
        });

        it('of bad leaver even before anything is accumulated', async () => {
          const calcNewStake = ZERO;
          await expectLeaverScenarioBeforeUnlock(DAYS_30.muln(13), calcNewStake, true);
        });

        it('of bad leaver random timestamps', async () => {
          const deltaSec = new BN('76126');
          const calcNewStake = LOCK_AMOUNT.mul(
            vestingPeriod.sub(deltaSec).addn(testBlockDiff)).div(vestingPeriod.muln(2)).divn(BAD_LEAVER_DIVISOR,
          );
          await expectLeaverScenarioBeforeUnlock(deltaSec, calcNewStake, true);
        });

        it('of bad leaver precalculated value', async () => {
          const deltaSec = DAYS_30.muln(6).addn(testBlockDiff);
          const calcNewStake = new BN(Q18.muln(25000));
          await expectLeaverScenarioBeforeUnlock(deltaSec, calcNewStake, true);
        });

        it('of bad leave of empty wallet', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiff);
          await expectLeaverScenarioBeforeUnlock(deltaSec, ZERO, true, accounts[7], ZERO, LOCK_AMOUNT);
        });

        it('of good leaver month before unlock', async () => {
        // leave 30 days before unlock starts so in 11/24 of acc period
        // keeps what's accumulated + 50% of what is to be accumulated
          const accumulated = LOCK_AMOUNT.mul(DAYS_30.muln(11).addn(testBlockDiff)).div(vestingPeriod.muln(2));
          const halfFutureAcc = LOCK_AMOUNT.sub(accumulated).divn(GOD_LEAVER_DIVISOR);
          const calcNewStake = accumulated.add(halfFutureAcc);
          await expectLeaverScenarioBeforeUnlock(DAYS_30, calcNewStake, false);
        });

        it('of good leaver even before anything is accumulated', async () => {
        // bad leaver gets half of all what is in the future
          const calcNewStake = LOCK_AMOUNT.divn(GOD_LEAVER_DIVISOR);
          await expectLeaverScenarioBeforeUnlock(DAYS_30.muln(13), calcNewStake, false);
        });

        it('of good leaver random timestamps', async () => {
          const deltaSec = new BN('76126');
          const accumulated = LOCK_AMOUNT.mul(
            vestingPeriod.sub(deltaSec).addn(testBlockDiff)).div(vestingPeriod.muln(2),
          );
          const halfFutureAcc = LOCK_AMOUNT.sub(accumulated).divn(GOD_LEAVER_DIVISOR);
          const calcNewStake = accumulated.add(halfFutureAcc);
          await expectLeaverScenarioBeforeUnlock(deltaSec, calcNewStake, false);
        });

        it('of good leaver precalculated value', async () => {
          const deltaSec = DAYS_30.muln(6).addn(testBlockDiff);
          const calcNewStake = new BN(Q18.muln(625000));
          await expectLeaverScenarioBeforeUnlock(deltaSec, calcNewStake, false);
        });

        it('of good leave of empty wallet', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiff);
          await expectLeaverScenarioBeforeUnlock(deltaSec, ZERO, false, accounts[7], ZERO, LOCK_AMOUNT);
        });
      });

      describe('after unlock', () => {
        // number of blocks shifted between start of the test and `leaveWallt` where amounts are calculated
        const testBlockDiff = 5;
        // in case of bad leaver that released > 10% acc the amount is the number of released tokens which is calculed
        // one block before `leaveWallet`
        const testBlockDiffBadGt10P = testBlockDiff - 1;

        async function expectLeaverScenarioAfterUnlock (
          startDateDelta,
          calcNewStake,
          isBadLeaver,
          wallet = stakedAccountID,
          lockAmount = LOCK_AMOUNT,
          finalLockBalance = ZERO) {
          const initialTs = await time.latest();
          // start into the past to simulate already unlocking contract
          const startDate = initialTs.sub(startDateDelta);
          const lock = await lockWithFund(startDate, vestingPeriod);
          // wallet takes out all that is due just before the leave as it would be real life
          await lock.release({ from: wallet });
          // the actual leave will happen few blocsk ahead so add it in advance
          const accumulated = await lock.tokensAccumulated(wallet, initialTs.addn(testBlockDiff));
          const released = await lock.unlockedTokensOf(wallet);
          let expectedStake;
          if (isBadLeaver) {
            const penalizedAcc = accumulated.divn(BAD_LEAVER_DIVISOR);
            expectedStake = released.gt(penalizedAcc) ? released : penalizedAcc;
          } else {
            expectedStake = (accumulated).add(lockAmount.sub(accumulated).divn(GOD_LEAVER_DIVISOR));
          }
          expect(expectedStake).to.bignumber.eq(calcNewStake);

          // not yet leaved
          expect(await lock.hasLeaved(wallet)).to.be.bignumber.eq(ZERO);
          const tx = await lock.leaveWallet(wallet, isBadLeaver, { from: manager });
          const expectedLeaverType = isBadLeaver ? new BN(LeaverType.BadLeaver) : new BN(LeaverType.GoodLeaver);
          expectEvent(tx, 'LogLeave', { leaver: wallet, leaverType: expectedLeaverType, newTotalStake: calcNewStake });
          await expectTokenBalance(wallet, released);
          // has leaved
          expect(await lock.hasLeaved(wallet)).to.be.bignumber.eq(expectedLeaverType);
          // new stake to unlock
          expect(await lock.totalTokensOf(wallet)).to.be.bignumber.eq(calcNewStake);
          // and the rest is shifted to manager
          expect(await lock.totalTokensOf(manager)).to.be.bignumber.eq(lockAmount.sub(calcNewStake));
          // at this moment there's vested token value that is less than already unlocked - for the good leaver
          // this is a normal situation. for some time good leaver is not able to unlock any tokens
          const vestedAfterLeave = await lock.tokensVested(wallet, initialTs.addn(testBlockDiff));
          if (startDateDelta.gte(vestingPeriod)) {
            // for test cases where leaver event happens AFTER all tokens are unlocked
            // this is obvious edge case but must be tested because it's possible
            expect(vestedAfterLeave).to.be.bignumber.eq(released);
          } else {
            expect(vestedAfterLeave).to.be.bignumber.lte(released);
          }
          // now claim in the future (if initialTs allows)
          const futureDate1 = startDate.add(vestingPeriod.sub(DAYS_30));
          if (futureDate1.gt(initialTs)) {
            await time.increaseTo(futureDate1);
            // if we have situation that less is vested than was already taken from the contract
            // expect arithmetic overflow
            const vestedFuture1 = await lock.tokensVested(wallet, futureDate1);
            if (vestedFuture1.gte(released)) {
              await lock.release({ from: wallet });
            } else {
              // for our test cases possible only for bad leavers
              expect(isBadLeaver).to.eq(true);
              await expectRevert(
                lock.release({ from: wallet }),
                ARITH_REV_MSG,
              );
            }
            lock.release({ from: manager });
          }
          // now claim past the date all tokens are unlocked
          const futureDate2 = startDate.add(vestingPeriod);
          if (futureDate2.gt(initialTs)) {
            await time.increaseTo(futureDate2);
          }
          await lock.release({ from: wallet });
          await lock.release({ from: manager });
          // check end token balances
          await expectTokenBalance(wallet, calcNewStake);
          await expectTokenBalance(manager, lockAmount.sub(calcNewStake));
          // in all cases except unlocking empty wallet finalLockBalance == ZERO
          await expectTokenBalance(lock.address, finalLockBalance);
        }

        it('of bad leaver month after - released > 10% of acc', async () => {
          // leave 30 days after unlock starts - you get to keep only what was unlocked
          // actually calc the value (use addn 4 because a few blocks has passed till moment of measure)
          const calcNewStake = LOCK_AMOUNT.mul(DAYS_30.addn(testBlockDiffBadGt10P)).div(vestingPeriod);
          await expectLeaverScenarioAfterUnlock(DAYS_30, calcNewStake, true);
        });

        it('of bad leaver after all was already unlocked - released > 10% of acc', async () => {
          // even bad leaver got everything
          const calcNewStake = LOCK_AMOUNT;
          await expectLeaverScenarioAfterUnlock(DAYS_30.muln(13), calcNewStake, true);
        });

        it('of bad leaver random timestamps - released < 10% of acc', async () => {
          const deltaSec = new BN('76126');
          // bad leaver takes 10% of the accumulated
          const accumulated = LOCK_AMOUNT.mul(
            vestingPeriod.add(deltaSec).addn(testBlockDiff)).div(vestingPeriod.muln(2),
          );
          await expectLeaverScenarioAfterUnlock(deltaSec, accumulated.divn(BAD_LEAVER_DIVISOR), true);
        });

        it('of bad leaver random timestamp - released > 10% of acc', async () => {
          const deltaSec = new BN('7657126');
          // bad leaver takes what was released and nothing else
          const calcNewStake = LOCK_AMOUNT.mul(deltaSec.addn(testBlockDiffBadGt10P)).div(vestingPeriod);
          await expectLeaverScenarioAfterUnlock(deltaSec, calcNewStake, true);
        });

        it('of bad leaver precalculated value - released > 10% of acc', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiffBadGt10P);
          const calcNewStake = new BN(Q18.muln(500000));
          await expectLeaverScenarioAfterUnlock(deltaSec, calcNewStake, true);
        });

        it('of bad leave empty of wallet', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiff);
          await expectLeaverScenarioAfterUnlock(deltaSec, ZERO, true, accounts[7], ZERO, LOCK_AMOUNT);
        });

        it('of good leaver month after unlock', async () => {
        // leave 30 days after unlock starts so in 13/24 of acc period
        // keeps what's accumulated + 50% of what is to be accumulated
          const accumulated = LOCK_AMOUNT.mul(DAYS_30.muln(13).addn(testBlockDiff)).div(vestingPeriod.muln(2));
          const halfFutureAcc = LOCK_AMOUNT.sub(accumulated).divn(GOD_LEAVER_DIVISOR);
          const calcNewStake = accumulated.add(halfFutureAcc);
          await expectLeaverScenarioAfterUnlock(DAYS_30, calcNewStake, false);
        });

        it('of good leaver after all was already unlocked', async () => {
          // leaver gets full stake
          const calcNewStake = LOCK_AMOUNT;
          await expectLeaverScenarioAfterUnlock(DAYS_30.muln(13), calcNewStake, false);
        });

        it('of good leaver random timestamps', async () => {
          const deltaSec = new BN('76126');
          const accumulated = LOCK_AMOUNT.mul(
            vestingPeriod.add(deltaSec).addn(testBlockDiff)).div(vestingPeriod.muln(2),
          );
          const halfFutureAcc = LOCK_AMOUNT.sub(accumulated).divn(GOD_LEAVER_DIVISOR);
          const calcNewStake = accumulated.add(halfFutureAcc);
          await expectLeaverScenarioAfterUnlock(deltaSec, calcNewStake, false);
        });

        it('of good leaver precalculated value', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiff);
          const calcNewStake = new BN(Q18.muln(875000));
          await expectLeaverScenarioAfterUnlock(deltaSec, calcNewStake, false);
        });

        it('of good leave of empty wallet', async () => {
          const deltaSec = DAYS_30.muln(6).subn(testBlockDiff);
          await expectLeaverScenarioAfterUnlock(deltaSec, ZERO, false, accounts[7], ZERO, LOCK_AMOUNT);
        });
      });
    });

    it('in multiple leaver scenario', async () => {
      const testDelta = 8;
      // manager also has a stake initially
      const managerAmount = Q18.mul(new BN('50000000'));
      const badLeaver = accounts[2];
      const badLeaverAmount = Q18.mul(new BN('2570000'));
      const goodLeaver = accounts[3];
      const goodLeaverAmount = Q18.mul(new BN('12000000'));

      // 4 accounts
      const stakes = [
        { address: stakedAccountID, amount: LOCK_AMOUNT },
        { address: manager, amount: managerAmount },
        { address: badLeaver, amount: badLeaverAmount },
        { address: goodLeaver, amount: goodLeaverAmount },
      ];
      const totalStake = stakes.reduce((p, c) => p.add(c.amount), ZERO);
      const initialTs = await time.latest();
      const startDate = initialTs.add(vestingPeriod);// startDateDelta.add(initialTs);
      const lock = await newTokenLock(
        stakes,
        { startDate, vesting: vestingPeriod },
      );
      // send tokens to lock contract
      await WFAIRToken.transfer(lock.address, totalStake, { from: deployer });
      await lock.fund();
      // move to 3/4 of acc period which is 1/2 of vesting period
      await time.increaseTo(initialTs.add(vestingPeriod.muln(3).divn(2)));
      // bad leaver releases
      await lock.release({ from: badLeaver });
      // manager releases
      await lock.release({ from: manager });
      // good leaver does not
      await lock.leaveWallet(badLeaver, true, { from: manager });
      await lock.leaveWallet(goodLeaver, false, { from: manager });
      // good leaver releases now
      await lock.release({ from: goodLeaver });
      // manager releases now
      await lock.release({ from: manager });
      // move to the end
      await time.increaseTo(initialTs.add(vestingPeriod.muln(2).addn(testDelta)));
      // everyone releases
      for (const { address } of stakes) {
        await lock.release({ from: address });
      }
      await lock.release({ from: manager });
      // all taken from the contract
      expect(await WFAIRToken.balanceOf(lock.address)).to.be.bignumber.eq(ZERO);
      // total taken == total staked
      let endStakes = ZERO;
      for (const { address } of stakes) {
        endStakes = endStakes.add(await WFAIRToken.balanceOf(address));
      }
      expect(endStakes).to.be.bignumber.eq(totalStake);
      expect(await WFAIRToken.balanceOf(stakedAccountID)).to.be.bignumber.eq(LOCK_AMOUNT);

      const actualGoodLeaver = await WFAIRToken.balanceOf(goodLeaver);
      expect(actualGoodLeaver.sub(Q18.muln(10500000).abs())).to.be.bignumber.lt(Q18);

      // bad leaver took all unlocked tokens just before leaving so 1/2 of initial stake
      const actualBadLeaver = await WFAIRToken.balanceOf(badLeaver);
      expect(actualBadLeaver.sub(badLeaverAmount.divn(2)).abs()).to.be.bignumber.lt(Q18);
    });
  });

  describe('Leave access control', () => {
    let lock;

    beforeEach(async () => {
      lock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }]);
    });

    it('only manager', async () => {
      await expectRevert(lock.leaveWallet(stakedAccountID, true, { from: accounts[7] }), 'Only manager');
    });

    it('manager cannot leave', async () => {
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      await lock.fund();
      await expectRevert(lock.leaveWallet(manager, true, { from: manager }), 'Manager cannot leave');
    });

    it('can\'t leave twice', async () => {
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      await lock.fund();
      await lock.leaveWallet(stakedAccountID, true, { from: manager });
      await expectRevert(lock.leaveWallet(stakedAccountID, true, { from: manager }), 'Specified wallet already left');
    });

    it('must be funded', async () => {
      await expectRevert(lock.leaveWallet(stakedAccountID, true, { from: manager }), 'Not in Initialized state');
    });
  });
});
