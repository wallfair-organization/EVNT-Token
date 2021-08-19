// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract TokenLock {
    using SafeERC20 for IERC20;

    struct UnlockState {
        // we never write both values together so packaging struct into sinle word wit uint128 does not make sense
        uint256 totalTokens;
        uint256 unlockedTokens;
    }

    IERC20 private immutable _token;

    uint256 private immutable _startTime; // Unix timestamp

    uint256 private immutable _vestingPeriod; // in seconds

    uint256 private immutable _cliffPeriod; // in seconds

    mapping(address => UnlockState) internal _stakes;

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriod_,
        uint256 cliffPeriod_,
        address[] memory wallets_,
        uint128[] memory amounts_
    ) {
        require(wallets_.length == amounts_.length, "number of elements in lists must match");

        _token = token_;
        _startTime = startTime_;
        _vestingPeriod = vestingPeriod_;
        _cliffPeriod = cliffPeriod_;

        // create stakes, duplicates override each other and are not checked
        for (uint256 ii = 0; ii < wallets_.length; ii += 1) {
            _stakes[wallets_[ii]].totalTokens = amounts_[ii];
        }
    }

    /**
     * @return the token being held.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the start of the unlock period.
     */
    function startTime() public view returns (uint256) {
        return _startTime;
    }

    /**
     * @return the number of months in the vesting period.
     */
    function vestingPeriod() public view returns (uint256) {
        return _vestingPeriod;
    }

    /**
     * @return the number of cliff months
     */
    function cliffPeriod() public view returns (uint256) {
        return _cliffPeriod;
    }

    function unlockedTokensOf(address sender) public view returns (uint256) {
        return _stakes[sender].unlockedTokens;
    }

    function totalTokensOf(address sender) public view returns (uint256) {
        return _stakes[sender].totalTokens;
    }

    /*
     * @return 0 if cliff period has not been exceeded and 1 if it has
     */
    function cliffExceeded(uint256 timestamp) public view returns (uint256) {
        return (timestamp >= _startTime + _cliffPeriod) ? 1 : 0;
    }

    /*
     * @return number of tokens that have vested at a given time
     */
    function tokensVested(address sender, uint256 timestamp) public view returns (uint256) {
        uint256 timeVestedSoFar = 0;

        if (timestamp > _startTime) {
            timeVestedSoFar = Math.min((timestamp - _startTime) * cliffExceeded(timestamp), _vestingPeriod);
        }

        return (_stakes[sender].totalTokens * timeVestedSoFar) / _vestingPeriod;
    }

    function release() public {
        address sender = msg.sender;

        uint256 unlockAmount = tokensVested(sender, block.timestamp) - unlockedTokensOf(sender);
        UnlockState storage stake = _stakes[sender];

        // this should never happen
        assert(stake.totalTokens >= stake.unlockedTokens + unlockAmount);

        stake.unlockedTokens += unlockAmount;
        token().safeTransfer(sender, unlockAmount);
    }
}
