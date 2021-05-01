// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./ITokenlock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of ITokenlock

contract FriendsTokenlock is ITokenlock {
    constructor (address wallfairToken_)
    ITokenlock(WallfairToken(wallfairToken_), 1612137600, 666, 30) {
        stakes[0xDC58072241ec23EFcA24D9Cb5280374921BFe023] = UnlockState(1000000000, 300000000);
    }
}
