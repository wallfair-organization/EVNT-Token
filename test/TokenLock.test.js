import { deployWFAIR, deployTokenLock } from './utils/deploy';
import { Q18, WFAIR_TOTAL_SUPPLY, ZERO, DAYS_30 } from './utils/consts';
import { BN, expectRevert, time, expectEvent } from '@openzeppelin/test-helpers';
import { LockState } from './utils/state';
import { expect } from 'hardhat';
import { web3 } from '@openzeppelin/test-helpers/src/setup';
const Math = require('mathjs');

const TokenLock = artifacts.require('TokenLock');

contract('TokenLock', function (accounts) {
  const deployer = accounts[5];
  const stakedAccountID = accounts[1];

  // use some odd lock amount so any rounding errors will come out
  const LOCK_AMOUNT = (new BN('1000000')).mul(Q18).add(new BN(1));
  // VESTING AND CLIFF must be divisible by 30 days
  const VESTING = new BN(4 * 360 * 24 * 60 * 60);
  const CLIFF = new BN(1 * 360 * 24 * 60 * 60);
  const START_DATE = new BN(1612137600);

  let WFAIRToken;

  async function newTokenLock (stakes, options) {
    const lockOpts = Object.assign(
      { startDate: START_DATE, vesting: VESTING, cliff: CLIFF, initial: ZERO },
      options || {},
    );
    const lock = await deployTokenLock(WFAIRToken.address,
      ...Object.values(lockOpts),
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
      let lock = await newTokenLock([]);
      expect(await lock.token()).to.equal(WFAIRToken.address);
      expect(await lock.startTime()).to.be.a.bignumber.to.equal(START_DATE);
      expect(await lock.vestingPeriod()).to.be.a.bignumber.to.equal(VESTING);
      expect(await lock.cliffPeriod()).to.be.a.bignumber.to.equal(CLIFF);
      expect(await lock.initialReleaseFraction()).to.be.a.bignumber.to.equal(ZERO);
      expect(await lock.totalLockedTokens()).to.be.a.bignumber.to.equal(ZERO);
      expect(await lock.state()).to.be.a.bignumber.to.equal(new BN(LockState.Initialized));
      expectEvent(lock.receipt, 'LogInitialized', { totalLockedAmount: ZERO });

      // redeploy to check initial release getter
      lock = await newTokenLock([], { cliff: ZERO, initial: Q18 });
      expect(await lock.initialReleaseFraction()).to.be.a.bignumber.to.equal(Q18);
    });

    it('and rejects on non equal lists', async () => {
      await expectRevert(
        TokenLock.new(WFAIRToken.address,
          START_DATE,
          VESTING,
          CLIFF,
          ZERO,
          [accounts[0]],
          [],
        ),
        'number of elements in lists must match',
      );
    });

    it('and reject on all constructor constraints', async () => {
      // periods must divide by DAYS_30
      await expectRevert(
        newTokenLock([], { vesting: DAYS_30.muln(2).subn(1) }),
        'vestingPeriod_ must be divisible by 30 days',
      );
      await expectRevert(newTokenLock([], { cliff: DAYS_30.subn(1) }), 'cliffPeriod_ must be divisible by 30 days');
      // vesting period cannot be 0
      await expectRevert(newTokenLock([], { vesting: ZERO }), 'vestingPeriod_ must be greater than 0');
      // cliff must be < vesting
      await expectRevert(
        newTokenLock([], { vesting: DAYS_30, cliff: DAYS_30 }),
        'cliffPeriod_ must be less than vestingPeriod_',
      );
      // cliff and initial release are exclusive
      await expectRevert(
        newTokenLock([], { cliff: DAYS_30, initial: Q18 }),
        'cliff period and initial release cannot be set together',
      );
      // decimal fraction <= 100%
      await expectRevert(
        newTokenLock([], { initial: Q18.addn(1) }),
        'initialReleaseFraction_ must be in range <0, 10**18>',
      );
    });

    it('and locks many addresses', async () => {
      const stakes = [{
        address: accounts[0],
        amount: Q18.mul(new BN('119827932')),
      },
      {
        address: accounts[1],
        amount: Q18.mul(new BN('78162')),
      },
      {
        address: accounts[2],
        amount: Q18.mul(new BN('1510289')),
      },
      ];
      await deployAndCheck(stakes);
    });

    it('and locks many addresses with 0 amount', async () => {
      const stakes = [{
        address: accounts[0],
        amount: Q18.mul(new BN('119827932')),
      },
      {
        address: accounts[1],
        amount: Q18.mul(new BN('0')),
      },
      {
        address: accounts[2],
        amount: Q18.mul(new BN('1510289')),
      },
      ];
      await deployAndCheck(stakes);
    });

    it('and revert on duplicate wallet address', async () => {
      const stakes = [{
        address: accounts[0],
        amount: Q18.mul(new BN('119827932')),
      },
      {
        address: accounts[0],
        amount: Q18.mul(new BN('1982791')),
      },
      ];
      await expectRevert(newTokenLock(stakes), 'Duplicates in list of wallets not allowed');
    });

    it('and keeps gas below block limit for 250 unlock wallets', async () => {
      const randomAddress = () => web3.utils.toChecksumAddress(web3.utils.randomHex(20));

      const stakes = [...Array(250)].map(() => { return { address: randomAddress(), amount: Q18 }; });
      const lock = await deployAndCheck(stakes);
      // this is less than current block limit
      expect(lock.receipt.gasUsed, 'Gas used must be less than 8.000.000').lt(8000000);
    });

    it('and keeps gas below block limit for 500 unlock wallets', async () => {
      const randomAddress = () => web3.utils.toChecksumAddress(web3.utils.randomHex(20));

      const stakes = [...Array(500)].map(() => { return { address: randomAddress(), amount: Q18 }; });
      const lock = await newTokenLock(stakes); ;
      // this is less than current block limit
      expect(lock.receipt.gasUsed, 'Gas used must be less than 25.000.000').lt(25000000);
    });

    async function deployAndCheck (stakes) {
      const lock = await newTokenLock(stakes);

      for (const s of stakes) {
        expect(await lock.totalTokensOf(s.address)).to.be.bignumber.eq(s.amount);
        expect(await lock.unlockedTokensOf(s.address)).to.be.bignumber.eq(ZERO);
        expectEvent(lock.receipt, 'LogLock', { wallet: s.address, amount: s.amount });
      }
      const totalAmount = stakes.reduce((p, c) => p.add(c.amount), ZERO);
      expect(await lock.totalLockedTokens()).to.be.bignumber.eq(totalAmount);
      expectEvent(lock.receipt, 'LogInitialized', { totalLockedAmount: totalAmount });
      return lock;
    }
  });

  function vestingFunctionCases (lock, vestingFunction, cliffPeriod, initialRelease) {
    it('check the initial vesting is 0 or initial release', async () => {
      expect(await lock().tokensVested(stakedAccountID, START_DATE)).to.be.a.bignumber.to.equal(initialRelease);
    });

    it('check no tokens are reported as vested before start date', async () => {
      for (let i = START_DATE.toNumber() - (365 * 24 * 60 * 60); i < START_DATE.toNumber();
        i += (Math.randomInt(604800, 2419200))) {
        expect(await lock().tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(ZERO);
      }
      // check one second before end
      expect(await lock().tokensVested(stakedAccountID, START_DATE.subn(1)))
        .to.be.a.bignumber.to.equal(ZERO);
    });

    it('check correct number of tokens are reported as vested', async () => {
      let expected;
      // this only checks release after cliff starts
      for (let i = START_DATE.add(cliffPeriod).toNumber(); i < START_DATE.add(VESTING).toNumber();
        i += (Math.randomInt(1, Math.floor(VESTING.toNumber() / 50)))) {
        expected = vestingFunction(new BN(i));
        expect(await lock().tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(expected);
      }
    });

    it('check correct number of tokens are reported as vested after vesting period', async () => {
      for (let i = START_DATE + VESTING; i < (START_DATE + VESTING + 100); i += 7) {
        expect(await lock().tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      }
    });
  };

  describe('Vesting  w/o Initial Release', () => {
    function vestingFunction (timestamp) {
      return LOCK_AMOUNT.mul(timestamp.sub(START_DATE)).div(VESTING);
    }

    describe(' and no cliff', () => {
      let lock;

      const getLock = () => lock;

      beforeEach(async () => {
        lock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }], { cliff: ZERO });
      });

      vestingFunctionCases(getLock, vestingFunction, ZERO, ZERO);
    });

    describe(' and cliff', () => {
      let lock;

      const getLock = () => lock;

      beforeEach(async () => {
        lock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }]);
      });

      vestingFunctionCases(getLock, vestingFunction, CLIFF, ZERO);

      it('check no tokens are reported as vested in cliff period', async () => {
        for (let i = START_DATE.toNumber(); i < START_DATE.add(CLIFF).toNumber();
          i += (Math.randomInt(1, Math.floor(CLIFF.toNumber() / 100)))) {
          expect(await lock.tokensVested(stakedAccountID, new BN(i)))
            .to.be.a.bignumber.to.equal(new BN('0'));
        }
      });

      it('check correct number of tokens are reported as vested for some known periods', async () => {
        const halfThrough = START_DATE.add(VESTING.div(new BN(2)));
        // 50% vested in 50% of time
        expect(await lock.tokensVested(stakedAccountID, halfThrough))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT.div(new BN(2)));
        // 75% vested in 75% of time
        const tfThrough = START_DATE.add(VESTING.mul(new BN(3)).div(new BN(4)));
        expect(await lock.tokensVested(stakedAccountID, tfThrough))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT.mul(new BN(3)).div(new BN(4)));
        // end
        expect(await lock.tokensVested(stakedAccountID, START_DATE.add(VESTING)))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      });
    });
  });

  describe('Vesting  w. Initial Release', () => {
    describe(' 100%', () => {
      let lock;

      const getLock = () => lock;

      function vestingFunction () {
        // all is released immediately
        return LOCK_AMOUNT;
      }

      beforeEach(async () => {
        lock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }], { cliff: ZERO, initial: Q18 });
      });

      vestingFunctionCases(getLock, vestingFunction, ZERO, LOCK_AMOUNT);

      it('check full amount is reported as vested for all known periods', async () => {
        // for 100% initial release all is released right away
        const halfThrough = START_DATE.add(VESTING.div(new BN(2)));
        expect(await lock.tokensVested(stakedAccountID, halfThrough))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
        const tfThrough = START_DATE.add(VESTING.mul(new BN(3)).div(new BN(4)));
        expect(await lock.tokensVested(stakedAccountID, tfThrough))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
        expect(await lock.tokensVested(stakedAccountID, START_DATE.add(VESTING)))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      });
    });

    describe(' 1/4 inital release', () => {
      let lock;

      const getLock = () => lock;

      // both Q18 and LOCK_AMOUNT are divisible by 4
      const releaseFraction = Q18.divn(4);
      const initialRelease = LOCK_AMOUNT.divn(4);

      function vestingFunction (timestamp) {
        return LOCK_AMOUNT.sub(initialRelease).mul(timestamp.sub(START_DATE)).div(VESTING).add(initialRelease);
      }

      beforeEach(async () => {
        lock = await newTokenLock(
          [{ address: stakedAccountID, amount: LOCK_AMOUNT }],
          { cliff: ZERO, initial: releaseFraction },
        );
      });

      vestingFunctionCases(getLock, vestingFunction, ZERO, initialRelease);

      it('check full amount is reported as vested for all known periods', async () => {
        const afterInitial = LOCK_AMOUNT.sub(initialRelease);

        const halfThrough = START_DATE.add(VESTING.div(new BN(2)));
        // 50% vested in 50% of time
        expect(await lock.tokensVested(stakedAccountID, halfThrough))
          .to.be.a.bignumber.to.equal(afterInitial.div(new BN(2)).add(initialRelease));
        // 75% vested in 75% of time
        const tfThrough = START_DATE.add(VESTING.mul(new BN(3)).div(new BN(4)));
        expect(await lock.tokensVested(stakedAccountID, tfThrough))
          .to.be.a.bignumber.to.equal(afterInitial.mul(new BN(3)).div(new BN(4)).add(initialRelease));
        // end
        expect(await lock.tokensVested(stakedAccountID, START_DATE.add(VESTING)))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      });
    });

    describe(' 1/3 inital release', () => {
      let lock;

      const getLock = () => lock;

      // best approx of 1/3 we can have for decimal fraction
      const releaseFraction = Q18.divn(3);

      function decimalFraction (amount, fraction) {
        return amount.mul(fraction).div(Q18);
      }

      const initialRelease = decimalFraction(LOCK_AMOUNT, releaseFraction);

      function vestingFunction (timestamp) {
        return LOCK_AMOUNT.sub(initialRelease).mul(timestamp.sub(START_DATE)).div(VESTING).add(initialRelease);
      }

      beforeEach(async () => {
        lock = await newTokenLock(
          [{ address: stakedAccountID, amount: LOCK_AMOUNT }],
          { cliff: ZERO, initial: releaseFraction },
        );
      });

      it('check decimal fraction calculation', async () => {
        // we are trying to approx. 1/3 so that should be appeox. equal (rounding)
        expect(LOCK_AMOUNT.divn(3).sub(initialRelease)).to.be.bignumber.to.lt(new BN('1000000'));
      });

      vestingFunctionCases(getLock, vestingFunction, ZERO, initialRelease);
    });
  });

  describe('Fund', () => {
    let lock;

    beforeEach(async () => {
      lock = await newTokenLock(
        [{ address: stakedAccountID, amount: LOCK_AMOUNT }],
      );
    });

    it(' rejects on not funded lock', async () => {
      expectRevert(lock.fund({ from: deployer }), 'No sufficient allowance to fund the contract');
    });

    it(' with token transfer', async () => {
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      // anyone can call fund function if contract is funded
      const tx = await lock.fund({ from: accounts[1] });
      expectEvent(tx, 'LogFunded');
    });

    it(' with token transfer above due amount', async () => {
      // the additional amount will be left in the contract, it's not giving back tokens
      // if sent with the transfer
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT.mul(new BN(2)), { from: deployer });
      const tx = await lock.fund({ from: deployer });
      expectEvent(tx, 'LogFunded');
      expect(await WFAIRToken.balanceOf(lock.address)).to.be.bignumber.eq(LOCK_AMOUNT.mul(new BN(2)));
    });

    it(' with allowance', async () => {
      await WFAIRToken.approve(lock.address, LOCK_AMOUNT, { from: deployer });
      // this must happen from owner account
      expectRevert(lock.fund({ from: accounts[7] }), 'No sufficient allowance to fund the contract');
      const tx = await lock.fund({ from: deployer });
      expectEvent(tx, 'LogFunded');
      expect(await WFAIRToken.balanceOf(lock.address)).to.be.bignumber.eq(LOCK_AMOUNT);
    });

    it(' with partial transfer partial allowance', async () => {
      // transfer Q18 to contract
      await WFAIRToken.transfer(lock.address, Q18, { from: deployer });
      // give one wei less so allowance is not enough
      await WFAIRToken.approve(lock.address, LOCK_AMOUNT.sub(Q18).sub(new BN(1)), { from: deployer });
      expectRevert(lock.fund({ from: deployer }), 'No sufficient allowance to fund the contract');
      // send one wei so we have exactly the allowance needed
      await WFAIRToken.transfer(lock.address, new BN(1), { from: deployer });
      const tx = await lock.fund({ from: deployer });
      expectEvent(tx, 'LogFunded');
      expect(await WFAIRToken.balanceOf(lock.address)).to.be.bignumber.eq(LOCK_AMOUNT);
    });

    it(' reject double fund', async () => {
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      await lock.fund({ from: accounts[1] });
      expectRevert(lock.fund({ from: deployer }), 'Not in Funded state');
    });

    it(' reject release before fund', async () => {
      expectRevert(lock.release({ from: stakedAccountID }), 'Not in Initialized state');
    });
  });

  describe('Release', () => {
    async function expectTokenBalance (owner, expectedBalance) {
      expect(await WFAIRToken.balanceOf(owner)).to.be.bignumber.eq(expectedBalance);
    }

    function vestingFunction (amount, elapsed, vesting, initialRelease) {
      return amount.sub(initialRelease).mul(elapsed).div(vesting);
    }

    async function releaseQuantum (amount, vesting, initialRelease) {
      // minimum value of tokens that can be released
      return vestingFunction(amount, new BN(1), vesting, initialRelease);
    }

    function expectRelease (release, expectedRelease, quantum) {
      expect(
        release.sub(expectedRelease).abs(),
        `expected release ${release.toString()} - expectedRelease ${expectedRelease} 
        (${release.sub(expectedRelease).abs()}) <= quantum ${quantum.toString()} )`,
      ).to.be.bignumber.lte(quantum);
    }

    it(' with one stake, initial release, full lifecycle', async () => {
      // we want 8.33% here
      // const releaseFraction = (new BN("833")).mul(Q18).divn(10**4);
      const releaseFraction = Q18.divn(4);
      const initialRelease = LOCK_AMOUNT.divn(4);
      const vestingPeriod = DAYS_30.muln(6);

      const initialTs = await time.latest();
      const startDate = DAYS_30.add(initialTs);

      // vesting starts month into the future
      const lock = await newTokenLock(
        [{ address: stakedAccountID, amount: LOCK_AMOUNT }],
        { startDate, vesting: vestingPeriod, cliff: ZERO, initial: releaseFraction },
      );
      // compute minimum release quantum
      const quantum = (await releaseQuantum(LOCK_AMOUNT, vestingPeriod, initialRelease)).addn(1);
      // send tokens to lock contract
      await WFAIRToken.transfer(lock.address, LOCK_AMOUNT, { from: deployer });
      await lock.fund();

      // check vested now
      let ts = await time.latest();
      let vested = await lock.tokensVested(stakedAccountID, ts);
      expect(vested).to.be.bignumber.eq(ZERO);
      let tx = await lock.release({ from: stakedAccountID });
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: ZERO });
      await expectTokenBalance(stakedAccountID, ZERO);

      // move to vesting start
      vested = await lock.tokensVested(stakedAccountID, startDate);
      expect(vested).to.be.bignumber.eq(initialRelease);
      await time.increaseTo(startDate);
      tx = await lock.release({ from: stakedAccountID });
      ts = await time.latest(); // should have tx timestamp
      // here we obtain exact value
      vested = await lock.tokensVested(stakedAccountID, ts);
      // if we hit exact second boundary this check may sometimes fail, rerun the test
      expectRelease(vested, initialRelease, quantum);
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: vested });
      expect(await lock.unlockedTokensOf(stakedAccountID)).to.be.bignumber.eq(vested);
      await expectTokenBalance(stakedAccountID, vested);
      // move to half the vesting
      await time.increaseTo(startDate.add(vestingPeriod.divn(2)));
      tx = await lock.release({ from: stakedAccountID });
      ts = await time.latest(); // should have tx timestamp
      const halfVested = await lock.tokensVested(stakedAccountID, ts);
      let released = halfVested.sub(vested);
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: released });
      // we expect half of the vested tokens released (w/o initial release, already released)
      const expectedRelease = LOCK_AMOUNT.sub(initialRelease).divn(2);
      expectRelease(released, expectedRelease, quantum);
      await expectTokenBalance(stakedAccountID, halfVested);
      // move exactly to vesting end -2 seconds
      await time.increaseTo(startDate.add(vestingPeriod).subn(2));
      // that mines block so we have at -1 seconds
      tx = await lock.release({ from: stakedAccountID });
      ts = await time.latest(); // should have tx timestamp
      const almostAllVested = await lock.tokensVested(stakedAccountID, ts);
      released = almostAllVested.sub(halfVested);
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: released });
      // we miss max 1 quantum to full unlock
      expectRelease(almostAllVested, LOCK_AMOUNT.sub(quantum), quantum);
      // set time explicitely to vesting end
      await time.increaseTo(startDate.add(vestingPeriod));
      tx = await lock.release({ from: stakedAccountID });
      const allVested = await lock.tokensVested(stakedAccountID, startDate.add(vestingPeriod));
      expect(allVested).to.be.bignumber.eq(LOCK_AMOUNT);
      released = allVested.sub(almostAllVested);
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: released });
      // released just 0 or one quantum
      expectRelease(released, quantum, quantum);
      // go forward
      await time.increase(vestingPeriod);
      tx = await lock.release({ from: stakedAccountID });
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: ZERO });
      // staker has it all
      await expectTokenBalance(stakedAccountID, LOCK_AMOUNT);
      expect(await lock.unlockedTokensOf(stakedAccountID)).to.be.bignumber.eq(LOCK_AMOUNT);
      // lock has none
      await expectTokenBalance(lock.address, ZERO);
    });

    it(' with two stakes and cliff', async () => {
      const secondStaker = accounts[2];
      const staker1Amount = Q18.muln(61251);
      const staker2Amount = Q18.muln(60012).addn(1);
      const totalLocked = staker1Amount.add(staker2Amount);

      const vestingPeriod = DAYS_30.muln(12);
      const cliffPeriod = DAYS_30.muln(4);

      const initialTs = await time.latest();
      const startDate = initialTs.sub(DAYS_30);

      // already one month elapsed
      const lock = await newTokenLock(
        [{ address: stakedAccountID, amount: staker1Amount }, { address: secondStaker, amount: staker2Amount }],
        { startDate, vesting: vestingPeriod, cliff: cliffPeriod, initial: ZERO },
      );
      // compute minimum release quantum
      const quantum = await releaseQuantum(totalLocked, vestingPeriod, ZERO);
      // send tokens to lock contract
      await WFAIRToken.transfer(lock.address, totalLocked, { from: deployer });
      await lock.fund();
      // no one can take anything
      let tx = await lock.release({ from: stakedAccountID });
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: ZERO });
      tx = await lock.release({ from: secondStaker });
      expectEvent(tx, 'LogRelease', { sender: secondStaker, amount: ZERO });
      // this user has no stake so his release is 0
      tx = await lock.release({ from: accounts[3] });
      expectEvent(tx, 'LogRelease', { sender: accounts[3], amount: ZERO });

      // move to cliff and release staker 2
      await time.increaseTo(startDate.add(cliffPeriod));
      tx = await lock.release({ from: secondStaker });
      const ts = await time.latest(); // should have tx timestamp
      // here we obtain exact value
      const vested = await lock.tokensVested(secondStaker, ts);
      // if we hit exact second boundary this check may sometimes fail, rerun the test
      // cliff is at 1/3 of vesting period
      expectRelease(vested, staker2Amount.divn(3), quantum);
      expectEvent(tx, 'LogRelease', { sender: secondStaker, amount: vested });
      expect(await lock.unlockedTokensOf(secondStaker)).to.be.bignumber.eq(vested);
      await expectTokenBalance(secondStaker, vested);
      // this user has no stake so his release is 0
      tx = await lock.release({ from: accounts[3] });
      expectEvent(tx, 'LogRelease', { sender: accounts[3], amount: ZERO });
      // move way after vesting and claim staker 1
      await time.increaseTo(startDate.add(vestingPeriod.muln(2)));
      tx = await lock.release({ from: stakedAccountID });
      expectEvent(tx, 'LogRelease', { sender: stakedAccountID, amount: staker1Amount });
      await expectTokenBalance(stakedAccountID, staker1Amount);
      // just make sure we can release all
      await lock.release({ from: secondStaker });
      await expectTokenBalance(lock.address, ZERO);
    });
  });
});
