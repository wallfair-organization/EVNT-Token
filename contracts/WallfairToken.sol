// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WallfairToken is ERC20("Wallfair. Token", "EVNT") {

    function mint(uint256 amount) public returns (bool) {

        require(totalSupply() + amount <= 400000000 * 10 ** decimals(), "You can't mint more then 400.000.000 EVNT");

        _mint(_msgSender(), amount);
        return true;
    }

}
