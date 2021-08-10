// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./TokenLock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of TokenLock
contract TestTokenLock is TokenLock {
    constructor(
        address wallfairToken_,
        address stakedAccount,
        uint256 totalTokens,
        uint16 percentage,
        uint16 initialPercentage,
        uint256 startDate
    )
        TokenLock(
            WallfairToken(wallfairToken_),
            startDate,
            percentage,
            initialPercentage
        )
    {
        _stakes[stakedAccount] = UnlockState(totalTokens, 0);
    }
}
