// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

<<<<<<< HEAD:contracts/tokenlocks/test-contracts/TestTokenLock.sol
import "../TokenLock.sol";
import "../../WallfairToken.sol";
=======
import "./TokenLock.sol";
>>>>>>> rfix/#MVP2-51_implement_ERC1363:contracts/tokenlocks/TestTokenlock.sol

// Note: This is just a sample Implementation of TokenLock
contract TestTokenLock is TokenLock {
    constructor(
        address EVNTToken_,
        address stakedAccount,
        uint256 totalTokens,
        uint256 startDate, // Unix timestamp
        uint256 vestingPeriod, // in seconds
        uint256 cliffPeriod // in seconds
    )

        TokenLock(
            IERC20(EVNTToken_),
            startDate,
            vestingPeriod,
            cliffPeriod
        )
    {
        _stakes[stakedAccount] = UnlockState(totalTokens, 0);
    }
}
