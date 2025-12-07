// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FTSO {
    uint256 public price;
    address public owner;

    constructor(uint256 _initialPrice) {
        price = _initialPrice;
        owner = msg.sender;
    }

    function setPrice(uint256 _price) external {
        require(msg.sender == owner, "Only owner");
        price = _price;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
