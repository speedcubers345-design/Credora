// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RedFlagNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Mapping to check if a user already has a flag
    mapping(address => bool) public hasFlag;

    constructor(address initialOwner)
        ERC721("Credora Red Flag", "FLAG")
        Ownable(initialOwner)
    {}

    function mintFlag(address to) public onlyOwner {
        require(!hasFlag[to], "User already flagged");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        hasFlag[to] = true;
    }

    function burnFlag(uint256 tokenId) public onlyOwner {
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        hasFlag[owner] = false;
    }

    // Soulbound: Prevent transfers
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("RedFlagNFT: Soulbound token, cannot transfer");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("RedFlagNFT: Soulbound token, cannot transfer");
    }
}
