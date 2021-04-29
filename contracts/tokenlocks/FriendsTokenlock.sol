// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./ITokenlock.sol";
import "../WallfairToken.sol";

// Note: This is just a sample Implementation of ITokenlock

// ToDo: Enter Correct data
contract FriendsTokenlock is ITokenlock(WallfairToken(address(0)), 1619693640, 666, 30) {
    constructor () {
        stakes[address(0)] = UnlockState(1000, 300);
    }
}
