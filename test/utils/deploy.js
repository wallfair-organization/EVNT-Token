const EVNTToken = artifacts.require('EVNTToken');
const TokenLock = artifacts.require('TokenLock');

export async function deployEVNT (totalSupply, deployer) {
  return EVNTToken.new(totalSupply, { from: deployer });
}

export async function deployTokenLock (tokenAddress, startTime, vestingPeriod, cliffPeriod, stakes) {
  return TokenLock.new(
    tokenAddress,
    startTime,
    vestingPeriod,
    cliffPeriod,
    stakes.map(({ address }) => address),
    stakes.map(({ amount }) => amount),
  );
}
