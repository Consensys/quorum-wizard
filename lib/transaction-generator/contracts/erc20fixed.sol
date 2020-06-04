pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Fixed is ERC20 {
    constructor() public ERC20("Token", "TKN") {
        _mint(msg.sender, 1000000);
    }
}
