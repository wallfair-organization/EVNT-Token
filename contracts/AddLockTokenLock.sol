// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./TokenLock.sol";

contract AddLockTokenLock is TokenLock {
    using SafeERC20 for IERC20;

    enum LeaverType {
        None,
        GoodLeaver,
        BadLeaver
    }

    event LogLeave(address indexed leaver, LeaverType leaverType, uint256 newTotalStake);
    event LogLockAmount(address indexed wallet, uint256 amount);

    // part of the accumulated tokens that stays with bad leaver
    uint256 internal constant BAD_LEAVER_DIVISOR = 10;

    // part of the tokens accumulated in the future that stays with the good leaver
    uint256 internal constant GOOD_LEAVER_DIVISOR = 2;

    // manager address that can execute leave method
    address internal _manager;

    // information on leavers
    mapping(address => LeaverType) internal _leavers;

    modifier onlyManager() {
        require(msg.sender == _manager, "Only manager");
        _;
    }

    modifier onlyNonLeaver(address wallet) {
        require(_leavers[wallet] == LeaverType.None, "Specified wallet already left");
        _;
    }

    constructor(
        IERC20 token_,
        uint256 startTime_,
        uint256 vestingPeriod_,
        address manager_,
        address[] memory wallets_,
        uint128[] memory amounts_
    ) TokenLock(token_, startTime_, vestingPeriod_, 0, 0, wallets_, amounts_) {
        _manager = manager_;
    }

    function managerAddress() public view returns (address) {
        return _manager;
    }

    function hasLeft(address wallet) public view returns (LeaverType) {
        return _leavers[wallet];
    }

    function lockAmount(address wallet, uint256 amount) public onlyManager onlyFunded onlyNonLeaver(wallet) {
        require(wallet != _manager, "Manager cannot restake itself");

        UnlockState memory managerStake = _stakes[_manager];

        // the difference between total tokens and unlocked tokens can be restaked to other accounts
        require(managerStake.totalTokens - managerStake.unlockedTokens >= amount, "Not enough available stake to add");

        // add stake to existing or new account
        _stakes[wallet].totalTokens += amount;
        // decrease manager stake
        _stakes[_manager].totalTokens = managerStake.totalTokens - amount;

        emit LogLockAmount(wallet, amount);
    }
}
