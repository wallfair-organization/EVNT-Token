const WFAIRToken = artifacts.require('WFAIRToken');
const TokenLock = artifacts.require('TokenLock');
const LeaverTokenLock = artifacts.require('LeaverTokenLock');

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

export async function deployLeaverTokenLock (tokenAddress, startTime, vestingPeriod, manager, stakes) {
  return LeaverTokenLock.new(
    tokenAddress,
    startTime,
    vestingPeriod,
    manager,
    stakes.map(({ address }) => address),
    stakes.map(({ amount }) => amount),
  );
}
