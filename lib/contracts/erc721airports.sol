pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Airports is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _hops;

    constructor() ERC721("Airport", "APT") public {
    }

    function addAirport(address entity, string memory airportCode) public returns (string memory) {
        _hops.increment();

        uint256 newItemId = _hops.current();
        _mint(entity, newItemId);

        return airportCode;
    }
}
