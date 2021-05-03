// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./TokenLock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of TokenLock
contract FriendsTokenLock is TokenLock {
    constructor (address wallfairToken_)
    TokenLock(WallfairToken(wallfairToken_), 1612137600, 666, 30) {
        _stakes[0xB4402f17c02421eEb3723F1033f880a0C123DC3A] = UnlockState(1000000 * 10 ** 18, 0);
    }
}
