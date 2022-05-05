//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';


import "./interfaces/IMerkleERC721.sol";


contract MerkleERC721 is IMerkleERC721, ERC721URIStorage, Ownable{

    bytes32 internal _merkleRoot; // tokenID to its merkle root
    mapping (uint256 => bool) internal _tokenRevealed; // Merkle root is already set for the corresponding tokenID
    // mapping (uint256 => string) internal _tokenURL; // Can be set only with a valid merkle proof
 
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

    // function tokenURI(uint256 tokenId) public view override returns (string memory){
    //     require(_exists(tokenId), "URI query for nonexistent token");

    //     return _tokenURL[tokenId];
    // }

    // function changeURI(uint256 tokenID, string calldata url, bytes32[] calldata proof) external override onlyTokenOwner(tokenID){
    //     bytes32 digest = _calculateHash(tokenID, url);
    //     bool isValid = MerkleProof.verify(proof, _merkleRoots[tokenID], digest);
    //     require(isValid, "Merkle proof is not valid");
    //     _tokenURL[tokenID] = url;

    //     emit UpdatedURL(tokenID, url);
    // }   

    function reveal(uint256 tokenID, string calldata newURL, bytes32[] calldata proof ) external {
        
    }

    function setMerkleRoot(bytes32 root) external onlyOwner{
        _merkleRoot = root;

        // emit MerkleRootUpdated(tokenID, root);      
    }

    function getMerkleRoot() external view returns(bytes32) {
        return _merkleRoot;
    }

    function _calculateHash(uint256 tokenID, string memory url) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(block.chainid, tokenID, url)
            );
    }


}