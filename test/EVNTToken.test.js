import { deployEVNT } from './utils/deploy';
import { Q18 } from './utils/consts';
import { expect } from 'hardhat';

const { BN } = require('@openzeppelin/test-helpers');

contract('EVNTToken', function (accounts) {
  it('Should deploy', async () => {
    const supply = Q18.mul(new BN('100000'));
    const deployer = accounts[0];

    const token = await deployEVNT(supply, deployer);

    expect(await token.balanceOf(deployer)).to.be.a.bignumber.to.equal(supply);
    expect(await token.totalSupply()).to.be.a.bignumber.to.equal(supply);
    expect(await token.symbol()).to.eq('EVNT');
    expect(await token.name()).to.eq('EVNT Token');
    expect(await token.decimals()).to.be.bignumber.eq(new BN('18'));
  });
});
