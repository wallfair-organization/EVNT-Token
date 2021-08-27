const WFAIRToken = artifacts.require('WFAIRToken');
const TokenLock = artifacts.require('TokenLock');

export async function deployWFAIR (totalSupply, deployer) {
  return WFAIRToken.new(totalSupply, { from: deployer });
}

export async function deployTokenLock (tokenAddress, startTime, vestingPeriod, cliffPeriod, initialRelease, stakes) {
  return TokenLock.new(
    tokenAddress,
    startTime,
    vestingPeriod,
    cliffPeriod,
    initialRelease,
    stakes.map(({ address }) => address),
    stakes.map(({ amount }) => amount),
  );
}
