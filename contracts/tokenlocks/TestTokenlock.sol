// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./TokenLock.sol";

// Note: This is just a sample Implementation of TokenLock
contract TestTokenLock is TokenLock {
    constructor(
        address EVNTToken_,
        address stakedAccount,
        uint256 totalTokens,
        uint256 vestingPeriodMonths,
        uint256 initialPercentage,
        uint256 startDate
    )
        TokenLock(
            IERC20(EVNTToken_),
            startDate,
            vestingPeriodMonths,
            initialPercentage
        )
    {
        _stakes[stakedAccount] = UnlockState(totalTokens, 0);
    }
}
