// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../TokenLock.sol";

// Note: This is just a sample Implementation of TokenLock
contract TestTokenLock is TokenLock {
    constructor(
        address EVNTToken_,
        address stakedAccount,
        uint256 totalTokens,
        uint256 startDate, // Unix timestamp
        uint256 vestingPeriod, // in seconds
        uint256 cliffPeriod // in seconds
    )

        TokenLock(
            IERC20(EVNTToken_),
            startDate,
            vestingPeriod,
            cliffPeriod
        )
    {
        _stakes[stakedAccount] = UnlockState(totalTokens, 0);
    }
}
