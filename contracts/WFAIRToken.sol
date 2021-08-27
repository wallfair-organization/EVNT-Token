// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";

contract EVNTToken is ERC1363 {
    // create EVNT token instance and immediately mint all tokens, no further minting will be possible
    constructor(uint256 totalSupply_) ERC20("EVNT Token", "EVNT") {
        _mint(msg.sender, totalSupply_);
    }
}
