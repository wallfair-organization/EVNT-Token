// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../utils/DateTime.sol";

contract ITokenlock is DateTime {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    IERC20 immutable private _token;

    uint immutable private _startTime;

    uint8 immutable private _percentage;

    uint8 immutable private _initialPercentage;

    mapping (address => UnlockState) private _stakes;

    struct UnlockState {
        uint ownedTokens;
        uint unlockedTokens;
    }

    constructor (IERC20 token_, uint startTime_, uint8 percentage_, uint8 initialPercentage_) {
        _token = token_;
        _startTime = startTime_;
        _percentage = percentage_;
        _initialPercentage = initialPercentage_;
    }

    /**
     * @return the token being held.
     */
    function token() public view virtual returns (IERC20) {
        return _token;
    }

    /**
     * @return the start of the unlock period.
     */
    function startTime() public view virtual returns (uint) {
        return _startTime;
    }

    /**
     * @return the percentage that gets unlocked every month.
     */
    function percentage() public view virtual returns (uint8) {
        return _percentage;
    }

    function release() public virtual {
        address sender = msg.sender;

        uint ownedTokens = _stakes[sender].ownedTokens;
        uint tokensToUnlock = (_stakes[sender].ownedTokens - ((ownedTokens * 30) / 100));

        // To account for float percentages like 6.66%
        uint unlockPortion = ((ownedTokens * percentage()) / 10000);
        uint8 unlockedMonths = (tokensToUnlock - _stakes[sender].unlockedTokens) / unlockPortion;

        require(block.timestamp >= startTime() + (unlockedMonths + 1) * 30 days, "No tokens to unlock");

        uint16 monthsToUnlock = _monthDiff(startTime(), block.timestamp);
        uint unlockAmount = unlockPortion * monthsToUnlock;

        _stakes[sender].unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }

    // == Utils ==

    function _monthDiff(uint date1, uint date2) private returns (uint16) {
        uint16 months = (getYear(date1) - getYear(date2)) * 12;
        months -= getMonth(date1);
        months += getMonth(date2);
        return months;
    }
}
