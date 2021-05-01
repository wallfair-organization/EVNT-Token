// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./ITokenlock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of ITokenlock

contract FriendsTokenlock is ITokenlock {
    constructor (address wallfairToken_) ITokenlock(WallfairToken(wallfairToken_), 1617062400, 666, 30) {
        stakes[0x04532a1ac51789A9E24d9A8B2aA2Bb382E9B1e80] = UnlockState(1000, 300);
    }
}
