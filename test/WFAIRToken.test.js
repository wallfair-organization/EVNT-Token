import { deployWFAIR } from './utils/deploy';
import { Q18 } from './utils/consts';
import { expect } from 'hardhat';
import { BN } from '@openzeppelin/test-helpers';

contract('WFAIRToken', function (accounts) {
  it('Should deploy', async () => {
    const supply = Q18.mul(new BN('100000'));
    const deployer = accounts[0];

    const token = await deployWFAIR(supply, deployer);

    expect(await token.balanceOf(deployer)).to.be.a.bignumber.to.equal(supply);
    expect(await token.totalSupply()).to.be.a.bignumber.to.equal(supply);
    expect(await token.symbol()).to.eq('WFAIR');
    expect(await token.name()).to.eq('WFAIR Token');
    expect(await token.decimals()).to.be.bignumber.eq(new BN('18'));
  });
});
