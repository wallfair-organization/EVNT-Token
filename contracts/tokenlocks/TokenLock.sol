// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../utils/DateTime.sol";

contract TokenLock is DateTime {
    using SafeERC20 for IERC20;

    IERC20 immutable private _token;

    uint immutable private _startTime;

    uint16 immutable private _percentage;

    uint8 immutable private _initialPercentage;

    mapping(address => UnlockState) internal _stakes;

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

    /**
     * @return the percentage that gets unlocked initially.
     */
    function initialPercentage() public view virtual returns (uint8) {
        return _initialPercentage;
    }

    function unlockPortion() public view hasStake virtual returns (uint) {
        // To account for float percentages like 6.66%
        return (_stakes[msg.sender].ownedTokens * percentage()) / 10000;
    }

    /**
     * @return the months that are already unlocked by the sender.
     */
    function unlockedMonths() public view hasStake virtual returns (uint16) {
        address sender = msg.sender;

        if (_stakes[msg.sender].unlockedTokens == 0) {return 0;}

        uint ownedTokens = _stakes[sender].ownedTokens;
        uint initialUnlock = (ownedTokens * initialPercentage()) / 100;

        return uint16((_stakes[sender].unlockedTokens - initialUnlock) / unlockPortion());
    }

    /**
     * @return the months that can be unlocked by the sender.
     */
    function unlockableMonths() public view hasStake virtual returns (uint16) {
        return _monthDiff(startTime(), block.timestamp) - unlockedMonths();
    }

    function releaseInitial() external hasStake virtual {
        address sender = msg.sender;

        require(_stakes[sender].unlockedTokens == 0, "'releaseInitial()' was called already");

        if (initialPercentage() > 0) {
            uint unlockAmount = (_stakes[sender].ownedTokens * initialPercentage()) / 100;
            unlockStake(unlockAmount);
        }
    }

    function release() external hasStake virtual {
        address sender = msg.sender;
        uint remainingAmount = _stakes[sender].ownedTokens - _stakes[sender].unlockedTokens;

        require(remainingAmount > 0, "All Tokens unlocked");
        require(_stakes[sender].unlockedTokens > 0, "'releaseInitial()' was not yet called");

        uint16 monthsToUnlock = unlockableMonths();

        require(monthsToUnlock > 0, "No tokens to unlock");

        if (monthsToUnlock > 12) {monthsToUnlock = 12;}

        uint unlockAmount = unlockPortion() * monthsToUnlock;

        if (unlockAmount > remainingAmount) {unlockAmount = remainingAmount;}

        unlockStake(unlockAmount);
    }

    // == Internals ==

    function unlockStake(uint unlockAmount) private {
        address sender = msg.sender;

        require(_stakes[sender].ownedTokens >= _stakes[sender].unlockedTokens + unlockAmount,
            "Tried to unlock more Tokens than owned");

        _stakes[sender].unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }

    // == Utils ==

    function _monthDiff(uint date1, uint date2) private pure returns (uint16) {
        uint16 months = (getYear(date2) - getYear(date1)) * 12;
        months += getMonth(date2) - getMonth(date1);
        return months;
    }

    // == Modifier ==

    modifier hasStake() {
        require(_stakes[msg.sender].ownedTokens > 0, "No tokens owned");
        _;
    }

}
