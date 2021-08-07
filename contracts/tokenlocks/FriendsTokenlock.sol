// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./TokenLock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of TokenLock
contract FriendsTokenLock is TokenLock {
    constructor(address wallfairToken_, address stakedAccount)
        TokenLock(WallfairToken(wallfairToken_), 1612137600, 666, 30)
    {
        _stakes[stakedAccount] = UnlockState(1000000 * 10**18, 0);
    }
}
