// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract TokenLock {
    using SafeERC20 for IERC20;

    IERC20 private immutable _token;

    uint256 private immutable _startTime; // Unix timestamp

    uint256 private immutable _vestingPeriod; // in seconds

    uint256 private immutable _cliffPeriod; // in seconds

    mapping(address => UnlockState) internal _stakes;

    struct UnlockState {
        uint256 totalTokens;
        uint256 unlockedTokens;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriod_,
        uint256 cliffPeriod_
    ) {
        _token = token_;
        _startTime = startTime_;
        _vestingPeriod = vestingPeriod_;
        _cliffPeriod = cliffPeriod_;
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
    function vestingPeriod() public view virtual returns (uint256) {
        return _vestingPeriod;
    }

    /**
     * @return the number of cliff months
     */
    function cliffPeriod() public view virtual returns (uint256) {
        return _cliffPeriod;
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
        // check if time vested has reached the cliff yet
        if ((timestamp - _startTime) < _cliffPeriod) {
            return 0;
        }

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
        uint256 timeVestedSoFar = Math.min(
            (timestamp - _startTime) * cliffExceeded(timestamp),
            _vestingPeriod
        );
        // ensure all tokens can eventually be claimed
        if (_vestingPeriod < timeVestedSoFar) return totalTokensOf(sender);
        return totalTokensOf(sender) * timeVestedSoFar / _vestingPeriod;
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

    // == Modifier ==

    modifier hasStake() {
        require(totalTokensOf(msg.sender) > 0, "No tokens locked");
        _;
    }
}
