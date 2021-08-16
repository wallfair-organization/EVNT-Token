// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";


contract EVNTToken is ERC1363 {
    address creator;

    constructor()
        ERC20("EVNT. Token", "EVNT") {
        creator = msg.sender;
    }

    function mint(uint256 amount) public isCreator returns (bool) {
        require(
            totalSupply() + amount <= 1000000000 * 10**decimals(),
            "You can't mint more then 400.000.000 EVNT"
        );

        _mint(_msgSender(), amount);
        return true;
    }

    modifier isCreator() {
        require(creator == msg.sender, "The caller is not the creator!");
        _;
    }
}
