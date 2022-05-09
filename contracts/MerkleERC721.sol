//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


import "./interfaces/IMerkleERC721.sol";


contract MerkleERC721 is IMerkleERC721, ERC721URIStorage, Ownable{

    bytes32 internal _merkleRoot; // can be set only with a valid merkle proof
    
    // --
    bool internal _revealEnabled;
    uint64 internal _maxSupply;
    // -- 

    mapping (uint256 => bool) internal _tokenRevealed; // Merkle root is already set for the corresponding tokenID

    modifier whenRevealEnabled(){
        require(_revealEnabled, "Reveal is enabled!");
        _;
    }

    modifier whenRevealDisabled(){
        require(!_revealEnabled, "Reveal is disabled!");
        _;
    }

    modifier whenNotAlreadySet(uint256 tokenID){
        require(!_tokenRevealed[tokenID], "Merkle root already set!");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenID){
        require(msg.sender == ownerOf(tokenID), "You are not the token owner!");
        _;
    }
  
    constructor(uint64 maxSupply) ERC721("Random", "RND") Ownable(){
        _maxSupply = maxSupply;
        _revealEnabled = false;
    }

    function mintNFT(address to, uint256 tokenID) external onlyOwner{
        require(_maxSupply > 0, "Max supply reached");
        _mint(to, tokenID);
        _maxSupply--;
    }

    function reveal(uint256 tokenID, string calldata newURL, bytes32[] calldata proof ) external override 
                                                    onlyTokenOwner(tokenID) whenNotAlreadySet(tokenID) whenRevealEnabled{
        bytes32 digest = _calculateHash(tokenID, newURL);
        bool isValid = MerkleProof.verify(proof, _merkleRoot, digest);
        require(isValid, "Merkle proof is not valid");
        
        _setTokenURI(tokenID, newURL);
        _tokenRevealed[tokenID] = true;

        emit UpdatedURL(tokenID, newURL);
    }

    function setMerkleRoot(bytes32 root) external override onlyOwner whenRevealDisabled{
        _merkleRoot = root;

        emit MerkleRootUpdated(root);      
    }

    function enableReveal() external override onlyOwner whenRevealDisabled{
        require(_merkleRoot != bytes32(0), "Merkle root not set!");
        _revealEnabled = true;
        emit RevealEnabled();
    }
    
    function revealEnabled() external view returns(bool){
        return _revealEnabled;
    }

    function getMerkleRoot() external view override returns(bytes32) {
        return _merkleRoot;
    }

    function _calculateHash(uint256 tokenID, string memory url) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(address(this) ,block.chainid, tokenID, url) // add address as param
            );
    }


}