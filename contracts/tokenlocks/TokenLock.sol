// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenLock {
    using SafeERC20 for IERC20;

    uint256 internal constant SECONDS_IN_MONTH = 2592000;

    IERC20 private immutable _token;

    uint256 private immutable _startTime;

    uint256 private immutable _vestingPeriodMonths;

    uint256 private immutable _cliffPeriodMonths;

    mapping(address => UnlockState) internal _stakes;

    struct UnlockState {
        uint256 totalTokens;
        uint256 unlockedTokens;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriodMonths_,
        uint256 cliffPeriodMonths_
    ) {
        _token = token_;
        _startTime = startTime_;
        _vestingPeriodMonths = vestingPeriodMonths_;
        _cliffPeriodMonths = cliffPeriodMonths_;
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
     * @return the number of months in the vesting period.
     */
    function vestingPeriodMonths() public view virtual returns (uint256) {
        return _vestingPeriodMonths;
    }

    /**
     * @return the number of cliff months
     */
    function cliffPeriodMonths() public view virtual returns (uint256) {
        return _cliffPeriodMonths;
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

   /*
    * @return 0 if cliff period has not been exceeded and 1 if it has
    */
    function cliffExceeded(uint256 timestamp)
        public
        view
        virtual
        returns (uint256)
    {
        if (_monthDiff(startTime(), timestamp) < _cliffPeriodMonths) return 0;
        return 1;
    }

   /*
    * @return number of tokens that have vested at a given time
    */
    function tokensVested(address sender, uint256 timestamp)
        public
        view
        virtual
        returns (uint256)
    {
        uint256 monthsVested = _min(
                            monthDiff(startTime(), timestamp) * cliffExceeded(timestamp),
                            vestingPeriodMonths()
                           );
        // ensure all tokens can eventually be claimed
        if (vestingPeriodMonths() <= monthsVested) return totalTokensOf(sender);
        return totalTokensOf(sender) / monthsVested;
    }

    function release() external virtual hasStake {
        address sender = msg.sender;
        uint256 unlockAmount = tokensVested(sender, block.timestamp) -
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

    function monthDiff(uint256 startDate, uint256 targetDate)
        public
        view
        virtual
        returns (uint256)
    {
        return _monthDiff(startDate, targetDate);
    }

    function _monthDiff(uint256 startDate, uint256 targetDate)
        private
        pure
        returns (uint256)
    {
        if (targetDate <= startDate) {
            return 0;
        }

        uint256 diff = targetDate - startDate;
        uint256 quotient = diff / SECONDS_IN_MONTH;

        return quotient;
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        if (a > b) return b;
        return a;
    }

    // == Modifier ==

    modifier hasStake() {
        require(totalTokensOf(msg.sender) > 0, "No tokens locked");
        _;
    }
}
