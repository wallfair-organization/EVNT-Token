// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";

contract EVNTToken is ERC1363 {
    // create EVNT token instance and immediately mint all tokens, no further minting will be possible
    constructor(address[] memory wallets, uint256[] memory amounts) ERC20("EVNT Token", "EVNT") {
        require(wallets.length == amounts.length, "number of elements in lists must match");
        for (uint256 ii = 0; ii < wallets.length; ii += 1) {
            _mint(wallets[ii], amounts[ii]);
        }
    }
}
