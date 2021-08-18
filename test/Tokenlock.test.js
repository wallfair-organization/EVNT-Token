// import Math from 'mathjs';
import { deployEVNT, deployTokenLock } from './utils/deploy';
import { Q18, EVNTTotalSupply } from './utils/consts';
import { BN, expectRevert } from '@openzeppelin/test-helpers';
const Math = require('mathjs');

const TokenLock = artifacts.require('TokenLock');

contract('TestTokenLock', function (accounts) {
  const deployer = accounts[5];
  const stakedAccountID = accounts[1];

  // use some odd lock amount so any rounding errors will come out
  const LOCK_AMOUNT = (new BN('1000000')).mul(Q18).add(new BN(1));
  const VESTING = new BN(4 * 365 * 24 * 60 * 60).add(new BN(1));
  const CLIFF = new BN(1 * 365 * 24 * 60 * 60);
  const START_DATE = new BN(1612137600);

  let evntToken;

  async function newTokenLock (stakes, cliffOverride, vestingOverride) {
    return deployTokenLock(evntToken.address,
      START_DATE,
      vestingOverride === undefined ? VESTING : vestingOverride,
      cliffOverride === undefined ? CLIFF : cliffOverride,
      stakes,
    );
  }

  beforeEach(async () => {
    evntToken = await deployEVNT(EVNTTotalSupply, deployer);
  });

  describe('Should deploy', () => {
    it('and have getters set', async () => {
      // deploy without stakes just to check view functions
      const lock = await newTokenLock([]);
      expect(await lock.token()).to.equal(evntToken.address);
      expect(await lock.startTime()).to.be.a.bignumber.to.equal(START_DATE);
      expect(await lock.vestingPeriod()).to.be.a.bignumber.to.equal(VESTING);
      expect(await lock.cliffPeriod()).to.be.a.bignumber.to.equal(CLIFF);
    });

    it('and rejects on non equal lists', async () => {
      expectRevert(
        TokenLock.new(evntToken.address,
          START_DATE,
          VESTING,
          CLIFF,
          [accounts[0]],
          [],
        ),
        'number of elements in lists must match',
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

    it('and locks same address many times', async () => {
      const stakes = [{
        address: accounts[0],
        amount: Q18.mul(new BN('119827932')),
      },
      {
        address: accounts[0],
        amount: Q18.mul(new BN('1982791')),
      },
      ];
      const lock = await newTokenLock(stakes);
      const total = await lock.totalTokensOf(accounts[0]);
      // last stake for given addres overrides the rest
      expect(total).to.be.a.bignumber.to.equal(stakes[1].amount);
    });

    async function deployAndCheck (stakes) {
      const lock = await newTokenLock(stakes);

      for (const s of stakes) {
        expect(await lock.totalTokensOf(s.address)).to.be.bignumber.eq(s.amount);
        expect(await lock.unlockedTokensOf(s.address)).to.be.bignumber.eq(new BN('0'));
      }

      return lock;
    }
  });

  describe('Vesting Function', () => {
    let testTokenLock, testTokenLockNoCliff;

    beforeEach(async () => {
      testTokenLock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }]);
      testTokenLockNoCliff = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }], new BN(0));
    });

    it('check the initial vesting is 0', async () => {
      expect(await testTokenLock.tokensVested(stakedAccountID, START_DATE)).to.be.a.bignumber.to.equal(new BN('0'));
    });

    it('check cliff period has not been exceeded for lock with cliff at start date', async () => {
      expect(await testTokenLock.cliffExceeded(START_DATE.sub(new BN(1)))).to.be.a.bignumber.to.equal(new BN('0'));
      expect(await testTokenLock.cliffExceeded(START_DATE)).to.be.a.bignumber.to.equal(new BN('0'));
      expect(await testTokenLock.cliffExceeded(START_DATE.add(new BN(1)))).to.be.a.bignumber.to.equal(new BN('0'));
      expect(await testTokenLock.cliffExceeded(START_DATE.add(CLIFF))).to.be.a.bignumber.to.equal(new BN('1'));
    });

    it('check cliff period has been exceeded for lock with no cliff contract', async () => {
      expect(await testTokenLockNoCliff.cliffExceeded(START_DATE.sub(new BN(1))))
        .to.be.a.bignumber.to.equal(new BN('0'));
      expect(await testTokenLockNoCliff.cliffExceeded(START_DATE)).to.be.a.bignumber.to.equal(new BN('1'));
      expect(await testTokenLockNoCliff.cliffExceeded(START_DATE.add(new BN(1))))
        .to.be.a.bignumber.to.equal(new BN('1'));
    });

    it('check no tokens are reported as vested in cliff period', async () => {
      for (let i = START_DATE.toNumber(); i < START_DATE.add(CLIFF).toNumber();
        i += (Math.randomInt(1, Math.floor(CLIFF.toNumber() / 100)))) {
        expect(await testTokenLock.tokensVested(stakedAccountID, new BN(i)))
          .to.be.a.bignumber.to.equal(new BN('0'));
      }
    });

    it('check no tokens are reported as vested before start date', async () => {
      for (let i = START_DATE.toNumber() - (365 * 24 * 60 * 60); i < START_DATE.toNumber();
        i += (Math.randomInt(604800, 2419200))) {
        expect(await testTokenLock.tokensVested(stakedAccountID, i.toString())).to.be.a.bignumber.to.equal(new BN('0'));
      }
    });

    it('check no tokens are reported as vested before start date with no cliff', async () => {
      for (let i = START_DATE.toNumber() - (365 * 24 * 60 * 60); i < START_DATE.toNumber();
        i += (Math.randomInt(604800, 2419200))) {
        expect(await testTokenLockNoCliff.tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(new BN('0'));
      }
    });

    it('check correct number of tokens are reported as vested after cliff period', async () => {
      let expected;
      for (let i = START_DATE.add(CLIFF).toNumber(); i < START_DATE.add(VESTING).toNumber();
        i += (Math.randomInt(1, Math.floor(VESTING.toNumber() / 50)))) {
        // console.log(amount.mul(new BN((i - START_DATE).toString())).div(new BN(VESTING.toString())).toString());
        expected = LOCK_AMOUNT.mul(new BN(i).sub(START_DATE)).div(VESTING);
        expect(await testTokenLock.tokensVested(stakedAccountID, i.toString())).to.be.a.bignumber.to.equal(expected);
      }
    });

    it('check correct number of tokens are reported as vested after cliff period for some known periods', async () => {
      // use vesting divisible by 2
      const vestingPeriod = new BN(4 * 365 * 24 * 60 * 60);
      testTokenLock = await newTokenLock([{ address: stakedAccountID, amount: LOCK_AMOUNT }], CLIFF, vestingPeriod);

      const halfThrough = START_DATE.add(vestingPeriod.div(new BN(2)));
      // 50% vested in 50% of time
      expect(await testTokenLock.tokensVested(stakedAccountID, halfThrough))
        .to.be.a.bignumber.to.equal(LOCK_AMOUNT.div(new BN(2)));
      // 75% vested in 75% of time
      const tfThrough = START_DATE.add(vestingPeriod.mul(new BN(3)).div(new BN(4)));
      expect(await testTokenLock.tokensVested(stakedAccountID, tfThrough))
        .to.be.a.bignumber.to.equal(LOCK_AMOUNT.mul(new BN(3)).div(new BN(4)));
      // end
      expect(await testTokenLock.tokensVested(stakedAccountID, START_DATE.add(vestingPeriod)))
        .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
    });

    it('check correct number of tokens are reported as vested with no cliff period', async () => {
      let expected;
      for (let i = START_DATE.toNumber(); i < START_DATE.add(VESTING).toNumber();
        i += (Math.randomInt(1, Math.floor(VESTING.toNumber() / 50)))) {
        // console.log(amount.mul(new BN((i - START_DATE).toString())).div(new BN(VESTING.toString())).toString());
        expected = LOCK_AMOUNT.mul(new BN(i).sub(START_DATE)).div(VESTING);
        expect(await testTokenLockNoCliff.tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(expected);
      }
    });

    it('check correct number of tokens are reported as vested after vesting period', async () => {
      for (let i = START_DATE.add(VESTING).toNumber(); i < START_DATE.add(VESTING).toNumber() + 100; i += 7) {
        expect(await testTokenLock.tokensVested(stakedAccountID, i.toString())).to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      }
    });

    it('check correct number of tokens are reported as vested with no cliff after vesting period', async () => {
      for (let i = START_DATE + VESTING; i < (START_DATE + VESTING + 100); i += 7) {
        expect(await testTokenLockNoCliff.tokensVested(stakedAccountID, i.toString()))
          .to.be.a.bignumber.to.equal(LOCK_AMOUNT);
      }
    });
  });

  describe('Release', () => {});
});
