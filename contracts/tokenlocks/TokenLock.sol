// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../utils/DateTime.sol";

contract TokenLock is DateTime {
    using SafeERC20 for IERC20;

    IERC20 private immutable _token;

    uint256 private immutable _startTime;

    uint16 private immutable _percentage;

    uint16 private immutable _initialPercentage;

    mapping(address => UnlockState) internal _stakes;

    struct UnlockState {
        uint256 totalTokens;
        uint256 unlockedTokens;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint16 percentage_,
        uint16 initialPercentage_
    ) {
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
    function startTime() public view virtual returns (uint256) {
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
    function initialPercentage() public view virtual returns (uint16) {
        return _initialPercentage;
    }

    function initialUnlockPortion(address sender)
        public
        view
        virtual
        returns (uint256)
    {
        // To account for float percentages like 6.66%
        return (totalTokensOf(sender) * initialPercentage()) / 10000;
    }

    function unlockPortion(address sender)
        public
        view
        virtual
        returns (uint256)
    {
        // To account for float percentages like 6.66%
        return (totalTokensOf(sender) * percentage()) / 10000;
    }

    function unlockedTokensOf(address sender)
        public
        view
        virtual
        returns (uint256)
    {
        return _stakes[sender].unlockedTokens;
    }

    function totalTokensOf(address sender)
        public
        view
        virtual
        returns (uint256)
    {
        return _stakes[sender].totalTokens;
    }

    function tokensDue(address sender, uint256 timestamp)
        public
        view
        virtual
        returns (uint256)
    {
        uint256 tokensDueResult = _monthDiff(startTime(), timestamp) *
            unlockPortion(sender);

        if (initialPercentage() > 0) {
            tokensDueResult += initialUnlockPortion(sender);
        }

        if (tokensDueResult > totalTokensOf(sender)) {
            return totalTokensOf(sender);
        }

        return tokensDueResult;
    }

    function release() external virtual hasStake {
        address sender = msg.sender;
        uint256 unlockAmount = tokensDue(sender, block.timestamp) -
            unlockedTokensOf(sender);

        require(unlockAmount > 0, "No tokens to unlock");

        _unlockStake(sender, unlockAmount);
    }

    // == Internals ==

    function _unlockStake(address sender, uint256 unlockAmount) private {
        require(
            totalTokensOf(sender) >= unlockedTokensOf(sender) + unlockAmount,
            "Tried to unlock more Tokens than locked"
        );

        _stakes[sender].unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }

    // == Utils ==

    function _monthDiff(uint256 date1, uint256 date2)
        private
        pure
        returns (uint16)
    {
        uint16 months = (getYear(date2) - getYear(date1)) * 12;
        months += getMonth(date2) - getMonth(date1);
        return months;
    }

    // == Modifier ==

    modifier hasStake() {
        require(totalTokensOf(msg.sender) > 0, "No tokens locked");
        _;
    }
}
