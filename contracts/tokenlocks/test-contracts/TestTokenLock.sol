// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../TokenLock.sol";
import "../../WallfairToken.sol";

// Note: This is just a sample Implementation of TokenLock
contract TestTokenLock is TokenLock {
    constructor(
        address wallfairToken_,
        address stakedAccount,
        uint256 totalTokens,
        uint256 startDate, // Unix timestamp
        uint256 vestingPeriod, // in seconds
        uint256 cliffPeriod // in seconds
    )

    TokenLock(
        WallfairToken(wallfairToken_),
        startDate,
        vestingPeriod,
        cliffPeriod
    ) {
        _stakes[stakedAccount] = UnlockState(totalTokens, 0);
    }
}
