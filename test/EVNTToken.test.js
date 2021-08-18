import { deployEVNT } from './utils/deploy';
import { Q18 } from './utils/consts';

const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const EVNTToken = artifacts.require('EVNTToken');

contract('EVNTToken', function (accounts) {
  before(() => {});

  it('Should deploy', async () => {
    const amount = Q18.mul(new BN('100000'));
    const investor = accounts[0];

    const token = await deployEVNT([{
      address: investor,
      amount,
    }]);

    expect(await token.balanceOf(investor)).to.be.a.bignumber.to.equal(amount);
    expect(await token.symbol()).to.eq('EVNT');
    expect(await token.name()).to.eq('EVNT Token');
    expect(await token.decimals()).to.be.bignumber.eq(new BN('18'));
  });

  it('Should reject on non equal lists', async () => {
    expectRevert(
      EVNTToken.new([accounts[0]], []),
      'number of elements in lists must match',
    );
  });

  it('Should mint to many addresses', async () => {
    const allocation = [{
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
    await deployAndCheck(allocation);
  });

  it('Should mint to many addresses with 0 amount', async () => {
    const allocation = [{
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
    await deployAndCheck(allocation);
  });

  it('Should mint to same address many times', async () => {
    const allocation = [{
      address: accounts[0],
      amount: Q18.mul(new BN('119827932')),
    },
    {
      address: accounts[0],
      amount: Q18.mul(new BN('1982791')),
    },
    ];
    const token = await deployEVNT(allocation);
    const balance = await token.balanceOf(accounts[0]);
    expect(balance).to.be.a.bignumber.to.equal(allocation[0].amount.add(allocation[1].amount));
  });

  async function deployAndCheck (allocation) {
    const token = await deployEVNT(allocation);

    for (const a of allocation) {
      expect(await token.balanceOf(a.address)).to.be.bignumber.eq(a.amount);
    }

    const amounts = allocation.map(({ amount }) => amount);
    const totalSupply = amounts.reduce((p, c) => p.add(c));

    expect(await token.totalSupply()).to.be.bignumber.eq(totalSupply);

    return token;
  }
});
