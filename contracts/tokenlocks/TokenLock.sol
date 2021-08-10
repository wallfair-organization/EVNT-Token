// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenLock {
    using SafeERC20 for IERC20;

    uint256 internal constant SECONDS_IN_MONTH = 2592000;

    IERC20 private immutable _token;

    uint256 private immutable _startTime;

    uint256 private immutable _percentage;

    uint256 private immutable _initialPercentage;

    mapping(address => UnlockState) internal _stakes;

    struct UnlockState {
        uint256 ownedTokens;
        uint256 unlockedTokens;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 percentage_,
        uint256 initialPercentage_
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
    function percentage() public view virtual returns (uint256) {
        return _percentage;
    }

    /**
     * @return the percentage that gets unlocked initially.
     */
    function initialPercentage() public view virtual returns (uint256) {
        return _initialPercentage;
    }

    function unlockPortion(address sender)
        public
        view
        virtual
        hasStake
        returns (uint256)
    {
        // To account for float percentages like 6.66%
        return (_stakes[sender].ownedTokens * percentage()) / 10000;
    }

    /**
     * @return the months that are already unlocked by the sender.
     */
    function unlockedMonths(address sender)
        public
        view
        virtual
        hasStake
        returns (uint256)
    {
        if (_stakes[sender].unlockedTokens == 0) {
            return 0;
        }

        uint256 ownedTokens = _stakes[sender].ownedTokens;
        uint256 initialUnlock = (ownedTokens * initialPercentage()) / 100;

        return
            uint256(
                (_stakes[sender].unlockedTokens - initialUnlock) /
                    unlockPortion(sender)
            );
    }

    /**
     * @return the months that can be unlocked by the sender.
     */
    function unlockableMonths(address sender)
        public
        view
        virtual
        hasStake
        returns (uint256)
    {
        return
            _monthDiff(startTime(), block.timestamp) - unlockedMonths(sender);
    }

    function releaseInitial() external virtual hasStake {
        address sender = msg.sender;

        require(
            _stakes[sender].unlockedTokens == 0,
            "'releaseInitial()' was called already"
        );

        if (initialPercentage() > 0) {
            uint256 unlockAmount = (_stakes[sender].ownedTokens *
                initialPercentage()) / 100;
            unlockStake(unlockAmount);
        }
    }

    function release() external virtual hasStake {
        address sender = msg.sender;
        uint256 remainingAmount = _stakes[sender].ownedTokens -
            _stakes[sender].unlockedTokens;

        require(remainingAmount > 0, "All Tokens unlocked");
        require(
            _stakes[sender].unlockedTokens > 0,
            "'releaseInitial()' was not yet called"
        );

        uint256 monthsToUnlock = unlockableMonths(sender);

        require(monthsToUnlock > 0, "No tokens to unlock");

        if (monthsToUnlock > 12) {
            monthsToUnlock = 12;
        }

        uint256 unlockAmount = unlockPortion(sender) * monthsToUnlock;

        if (unlockAmount > remainingAmount) {
            unlockAmount = remainingAmount;
        }

        unlockStake(unlockAmount);
    }

    // == Internals ==

    function unlockStake(uint256 unlockAmount) private {
        address sender = msg.sender;

        require(
            _stakes[sender].ownedTokens >=
                _stakes[sender].unlockedTokens + unlockAmount,
            "Tried to unlock more Tokens than owned"
        );

        _stakes[sender].unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }

    // == Utils ==

    function _monthDiff(uint256 startDate, uint256 targetDate)
        private
        pure
        returns (uint256)
    {
        require(
            targetDate >= startDate,
            "The Target-Date has to be larger than the Start-Date"
        );

        uint256 diff = targetDate - startDate;

        uint256 secondsAccountedFor;
        uint256 i;
        while (SECONDS_IN_MONTH + secondsAccountedFor < diff) {
            secondsAccountedFor += SECONDS_IN_MONTH;
            i++;
        }

        return i;
    }

    // == Modifier ==

    modifier hasStake() {
        require(_stakes[msg.sender].ownedTokens > 0, "No tokens owned");
        _;
    }
}
