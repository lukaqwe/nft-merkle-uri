//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


import "./interfaces/IMerkleERC721.sol";


contract MerkleERC721 is IMerkleERC721, ERC721URIStorage, Ownable{

    bytes32 internal _merkleRoot; // can be set only with a valid merkle proof
    mapping (uint256 => bool) internal _tokenRevealed; // Merkle root is already set for the corresponding tokenID

    modifier whenNotAlreadySet(uint256 tokenID){
        require(!_tokenRevealed[tokenID], "Merkle root already set!");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenID){
        require(msg.sender == ownerOf(tokenID), "You are not the token owner!");
        _;
    }
  
    constructor(uint256 initialSupply) ERC721("Random", "RND") Ownable(){
        for(uint tokenID = 1; tokenID <= initialSupply; tokenID++)
            _mint(msg.sender, tokenID);
    }

    function reveal(uint256 tokenID, string calldata newURL, bytes32[] calldata proof ) external override 
                                                            onlyTokenOwner(tokenID) whenNotAlreadySet(tokenID){
        bytes32 digest = _calculateHash(tokenID, newURL);
        bool isValid = MerkleProof.verify(proof, _merkleRoot, digest);
        require(isValid, "Merkle proof is not valid");
        
        _setTokenURI(tokenID, newURL);
        _tokenRevealed[tokenID] = true;
        
        emit UpdatedURL(tokenID, newURL);
    }

    function setMerkleRoot(bytes32 root) external override onlyOwner{
        _merkleRoot = root;

        emit MerkleRootUpdated(root);      
    }

    function getMerkleRoot() external view override returns(bytes32) {
        return _merkleRoot;
    }

    function _calculateHash(uint256 tokenID, string memory url) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(block.chainid, tokenID, url)
            );
    }


}