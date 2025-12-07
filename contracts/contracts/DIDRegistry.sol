// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DIDRegistry is Ownable {
    struct DIDInfo {
        bytes32 uniquePersonID;
        uint8 sybilResistanceLevel;
        bool identityValid;
        uint256 timestamp;
    }

    mapping(address => DIDInfo) public didRegistry;
    mapping(bytes32 => address) public personIdToAddress; // Check for duplicates on-chain too

    event DIDRegistered(address indexed user, bytes32 uniquePersonID, uint8 level);
    event DIDRevoked(address indexed user);

    constructor() Ownable(msg.sender) {}

    function registerDID(bytes32 _uniquePersonID, uint8 _sybilResistanceLevel) external {
        require(!didRegistry[msg.sender].identityValid, "DID already exists");
        require(personIdToAddress[_uniquePersonID] == address(0), "Person ID already registered");
        require(_sybilResistanceLevel >= 1 && _sybilResistanceLevel <= 5, "Invalid level");

        didRegistry[msg.sender] = DIDInfo({
            uniquePersonID: _uniquePersonID,
            sybilResistanceLevel: _sybilResistanceLevel,
            identityValid: true,
            timestamp: block.timestamp
        });

        personIdToAddress[_uniquePersonID] = msg.sender;

        emit DIDRegistered(msg.sender, _uniquePersonID, _sybilResistanceLevel);
    }

    function revokeDID(address _user) external onlyOwner {
        require(didRegistry[_user].identityValid, "DID not valid");
        
        bytes32 pid = didRegistry[_user].uniquePersonID;
        delete personIdToAddress[pid];
        
        didRegistry[_user].identityValid = false;
        didRegistry[_user].sybilResistanceLevel = 0;

        emit DIDRevoked(_user);
    }

    function getDIDStatus(address _user) external view returns (bool isValid, uint8 level) {
        return (didRegistry[_user].identityValid, didRegistry[_user].sybilResistanceLevel);
    }
}
