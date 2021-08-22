// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract TokenLock {
    using SafeERC20 for IERC20;

    // we never write both values together so packaging struct into sinle word wit uint128 does not make sense
    struct UnlockState {
        // total tokens to be released
        uint256 totalTokens;
        // already released tokens
        uint256 unlockedTokens;
    }

    // emitted on token release
    event LogRelease(address indexed sender, uint256 amount);

    uint256 private constant DAYS_30_PERIOD = 30 days;

    IERC20 private immutable _token;

    // start time of the vesting, Unix timestamp
    uint256 private immutable _startTime;

    // period of the vesting in seconds
    uint256 private immutable _vestingPeriod;

    // cliff period in seconds
    uint256 private immutable _cliffPeriod;

    // token release on _startTime, decimal fraction where 10**18 is 100%
    uint256 private immutable _initialReleaseFraction;

    mapping(address => UnlockState) internal _stakes;

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriod_,
        uint256 cliffPeriod_,
        uint256 initialReleaseFraction_,
        address[] memory wallets_,
        uint128[] memory amounts_
    ) {
        require(wallets_.length == amounts_.length, "number of elements in lists must match");
        // we put strong requirements for vesting parameters: this is not a generic vesting contract,
        // we support and test for just a limited range of parameters, see below
        require(vestingPeriod_ > 0, "vestingPeriod_ must be at least 30 days");
        // all periods must be divisible by 30 days
        require(vestingPeriod_ % DAYS_30_PERIOD == 0, "vestingPeriod_ must be divisible by 30 days");
        require(cliffPeriod_ % DAYS_30_PERIOD == 0, "cliffPeriod_ must be divisible by 30 days");
        // cliff must be shorted than total vesting period
        require(cliffPeriod_ < vestingPeriod_, "cliffPeriod_ must be less than vestingPeriod_");
        // decimal fraction is between 0 and 10**18
        require(initialReleaseFraction_ <= 10**18, "initialReleaseFraction_ must be in range <0, 10**18>");
        // cliff cannot be present if initial release is set
        require(
            !(initialReleaseFraction_ > 0 && cliffPeriod_ > 0),
            "cliff period and initial release cannot be set together"
        );

        _token = token_;
        _startTime = startTime_;
        _vestingPeriod = vestingPeriod_;
        _cliffPeriod = cliffPeriod_;
        _initialReleaseFraction = initialReleaseFraction_;

        // create stakes, duplicates override each other and are not checked
        for (uint256 ii = 0; ii < wallets_.length; ii += 1) {
            _stakes[wallets_[ii]].totalTokens = amounts_[ii];
        }
    }

    function token() public view returns (IERC20) {
        return _token;
    }

    function startTime() public view returns (uint256) {
        return _startTime;
    }

    function vestingPeriod() public view returns (uint256) {
        return _vestingPeriod;
    }

    function initialReleaseFraction() public view returns (uint256) {
        return _initialReleaseFraction;
    }

    function cliffPeriod() public view returns (uint256) {
        return _cliffPeriod;
    }

    function unlockedTokensOf(address sender) public view returns (uint256) {
        return _stakes[sender].unlockedTokens;
    }

    function totalTokensOf(address sender) public view returns (uint256) {
        return _stakes[sender].totalTokens;
    }

    function tokensVested(address sender, uint256 timestamp) public view returns (uint256 vestedTokens) {
        // returns 0 before (start time + cliff period)
        // initial release is obtained after cliff
        if (timestamp >= _startTime + _cliffPeriod) {
            uint256 timeVestedSoFar = Math.min(timestamp - _startTime, _vestingPeriod);
            uint256 stake = _stakes[sender].totalTokens;
            // compute initial release as fraction where 10**18 is total
            uint256 initialRelease = (stake * _initialReleaseFraction) / 10**18;
            // return initial release + the remainder proportionally to time from vesting start
            // mul first for best precision, v.8 compiler reverts on overflows
            vestedTokens = ((stake - initialRelease) * timeVestedSoFar) / _vestingPeriod + initialRelease;
        }
    }

    function release() public {
        address sender = msg.sender;

        uint256 unlockAmount = tokensVested(sender, block.timestamp) - unlockedTokensOf(sender);
        UnlockState storage stake = _stakes[sender];

        // this should never happen
        assert(stake.totalTokens >= stake.unlockedTokens + unlockAmount);

        stake.unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);

        emit LogRelease(sender, unlockAmount);
    }
}
