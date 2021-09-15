// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

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

    // possible state of the Lock
    // NotFunded is initial state
    // transition to Funded happens only when required amount of "token" is on contract's balance
    enum State {
        Initialized,
        Funded
    }

    // emitted on token release
    event LogRelease(address indexed sender, uint256 amount);

    // emitted on token locked
    event LogLock(address wallet, uint256 amount);

    // emitted when all stakes are added
    event LogInitialized(uint256 totalLockedAmount);

    // emitted on lock funded
    event LogFunded();

    modifier onlyFunded() {
        require(_state == State.Funded, "Not in Initialized state");
        _;
    }

    modifier onlyInitialized() {
        require(_state == State.Initialized, "Not in Funded state");
        _;
    }

    uint256 internal constant DAYS_30_PERIOD = 30 days;

    // a value representing a whole (100%) of decimal fraction
    uint256 internal constant FRACTION_WHOLE = 10**18;

    IERC20 internal immutable _token;

    // start time of the vesting, Unix timestamp
    uint256 internal immutable _startTime;

    // period of the vesting in seconds
    uint256 internal immutable _vestingPeriod;

    // cliff period in seconds
    uint256 internal immutable _cliffPeriod;

    // token release on _startTime, decimal fraction where FRACTION_WHOLE is 100%
    uint256 internal immutable _initialReleaseFraction;

    // locked amount held and total amount
    mapping(address => UnlockState) internal _stakes;
    uint256 internal immutable _totalLockedAmount;

    // current state of the contract
    State internal _state;

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
        require(vestingPeriod_ > 0, "vestingPeriod_ must be greater than 0");
        // all periods must be divisible by 30 days
        require(vestingPeriod_ % DAYS_30_PERIOD == 0, "vestingPeriod_ must be divisible by 30 days");
        require(cliffPeriod_ % DAYS_30_PERIOD == 0, "cliffPeriod_ must be divisible by 30 days");
        // cliff must be shorted than total vesting period
        require(cliffPeriod_ < vestingPeriod_, "cliffPeriod_ must be less than vestingPeriod_");
        // decimal fraction is between 0 and FRACTION_WHOLE
        require(initialReleaseFraction_ <= FRACTION_WHOLE, "initialReleaseFraction_ must be in range <0, 10**18>");
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
        uint256 totalLockedAmount;
        for (uint256 ii = 0; ii < wallets_.length; ii += 1) {
            // duplicates in list of wallets are not allowed
            require(_stakes[wallets_[ii]].totalTokens == 0, "Duplicates in list of wallets not allowed");

            _stakes[wallets_[ii]].totalTokens = amounts_[ii];
            totalLockedAmount += amounts_[ii];
            emit LogLock(wallets_[ii], amounts_[ii]);
        }
        _totalLockedAmount = totalLockedAmount;
        emit LogInitialized(totalLockedAmount);
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

    function totalLockedTokens() public view returns (uint256) {
        return _totalLockedAmount;
    }

    function state() public view returns (State) {
        return _state;
    }

    function tokensVested(address sender, uint256 timestamp) public view returns (uint256 vestedTokens) {
        return tokensVestedInternal(_stakes[sender].totalTokens, timestamp);
    }

    function release() public onlyFunded {
        address sender = msg.sender;
        UnlockState memory stake = _stakes[sender];
        uint256 unlockAmount = tokensVestedInternal(stake.totalTokens, block.timestamp) - stake.unlockedTokens;

        // this should never happen
        assert(stake.totalTokens >= stake.unlockedTokens + unlockAmount);

        _stakes[sender].unlockedTokens += unlockAmount;

        emit LogRelease(sender, unlockAmount);
        token().safeTransfer(sender, unlockAmount);
    }

    function fund() public onlyInitialized {
        // change state first so there's no re-entry, contract reverts in all error cases
        _state = State.Funded;

        // transfer only what is missing, that allows to fund contract in two ways
        // (1) token transfer to contract, then anyone can call fund() function
        // (2) approve() and transferFrom from msg.sender
        uint256 owned = _token.balanceOf(address(this));
        if (owned < _totalLockedAmount) {
            // attempt to transfer sufficient amount of tokens from sender
            uint256 due = _totalLockedAmount - owned;
            // check allowance to provide nice revert code
            require(
                token().allowance(msg.sender, address(this)) >= due,
                "No sufficient allowance to fund the contract"
            );
            token().safeTransferFrom(msg.sender, address(this), due);
        }

        // emit funded log
        emit LogFunded();
    }

    function tokensVestedInternal(uint256 totalTokens, uint256 timestamp) internal view returns (uint256 vestedTokens) {
        // returns 0 before (start time + cliff period)
        // initial release is obtained after cliff
        if (timestamp >= _startTime + _cliffPeriod) {
            uint256 timeVestedSoFar = Math.min(timestamp - _startTime, _vestingPeriod);
            // compute initial release as fraction where FRACTION_WHOLE is total
            uint256 initialRelease = (totalTokens * _initialReleaseFraction) / FRACTION_WHOLE;
            // return initial release + the remainder proportionally to time from vesting start
            // mul first for best precision, v.8 compiler reverts on overflows
            vestedTokens = ((totalTokens - initialRelease) * timeVestedSoFar) / _vestingPeriod + initialRelease;
        }
    }
}
