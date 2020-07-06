pragma solidity ^0.6.8;

contract SimpleStoragePrivate {
  uint public storedData;

  event StorageEvent(uint data);

  constructor(uint initVal) public {
    storedData = initVal;
  }

  function set(uint x) public {
    storedData = x;
    emit StorageEvent(x);
  }

  function get() view public returns (uint retVal) {
    return storedData;
  }
}
