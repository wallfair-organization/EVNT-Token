// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../utils/DateTime.sol";

contract ITokenlock is DateTime {
    using SafeERC20 for IERC20;
    using SafeMath for uint;
    using SafeMath for uint16;

    IERC20 immutable private _token;

    uint immutable private _startTime;

    uint16 immutable private _percentage;

    uint8 immutable private _initialPercentage;

    mapping (address => UnlockState) stakes;

    struct UnlockState {
        uint ownedTokens;
        uint unlockedTokens;
    }

    constructor (IERC20 token_, uint startTime_, uint16 percentage_, uint8 initialPercentage_) {
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
    function percentage() public view virtual returns (uint16) {
        return _percentage;
    }

    function unlockPortion() public view virtual returns (uint) {
        address sender = msg.sender;

        // To account for float percentages like 6.66%
        return (stakes[sender].ownedTokens * percentage()) / 10000;
    }

    function unlockedMonths() public view virtual returns (uint16) {
        address sender = msg.sender;

        uint ownedTokens = stakes[sender].ownedTokens;
        uint initialUnlock = (ownedTokens * _initialPercentage) / 100;

        return uint16((stakes[sender].unlockedTokens - initialUnlock) / unlockPortion());
    }

    function unlockableMonths() public view virtual returns (uint16) {
        return _monthDiff(startTime(), block.timestamp);// - unlockedMonths();
    }


    function release() public virtual {
        address sender = msg.sender;

        uint16 monthsToUnlock = unlockableMonths();

        require(monthsToUnlock > 0, "No tokens to unlock");

        uint unlockAmount = unlockPortion() * monthsToUnlock;

        stakes[sender].unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }

    // == Utils ==

    function _monthDiff(uint date1, uint date2) private pure returns (uint16) {
        uint16 months = (getYear(date2) - getYear(date1)) * 12;
        months += getMonth(date2) - getMonth(date1);
        return months;
    }
}
