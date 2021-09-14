// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./TokenLock.sol";


contract LeaverTokenLock is TokenLock {
    using SafeERC20 for IERC20;

    event LogLeave(address indexed leaver, uint256 remainingTokens);

    // manager address that can execute leave method
    address internal _manager;

    modifier onlyManager() {
        require(msg.sender == _manager, "Only manager");
        _;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriod_,
        uint256 cliffPeriod_,
        uint256 initialReleaseFraction_,
        address[] memory wallets_,
        uint128[] memory amounts_,
        address manager_
    ) TokenLock(
        token_,
        startTime_,
        vestingPeriod_,
        cliffPeriod_,
        initialReleaseFraction_,
        wallets_,
        amounts_
    ) {
        _manager = manager_;
    }

    function leave(address wallet) public onlyManager {
        UnlockState memory stake = _stakes[wallet];
        uint256 tokensVestedSoFar = tokensVestedInternal(stake.totalTokens, block.timestamp);
        uint256 unlockAmount = tokensVestedSoFar - stake.unlockedTokens;

        // this should never happen
        assert(stake.totalTokens >= stake.unlockedTokens + unlockAmount);

        if (unlockAmount > 0) {
            // send the original wallet what is now due
            token().safeTransfer(wallet, unlockAmount);
            emit LogRelease(wallet, unlockAmount);
        }

        // move stake to the manager
        _stakes[msg.sender].totalTokens += stake.totalTokens;
        _stakes[msg.sender].unlockedTokens += stake.unlockedTokens + unlockAmount;

        // remove stake from wallet
        delete _stakes[wallet];

        emit LogLeave(wallet, stake.totalTokens - tokensVestedSoFar);
    }
}