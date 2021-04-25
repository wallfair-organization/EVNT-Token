pragma solidity ^0.8.0;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract EVNTIcoToken is ERC20("Wallfair. Token", "EVNT") {
    // uint256 private _spendLimit = 100;
    function mint(uint256 amount) public returns (bool) {
        _mint(_msgSender(), amount);
        return true;
    }
}
