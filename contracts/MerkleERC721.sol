//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


import "./interfaces/IMerkleERC721.sol";

/// @author lukaqwe
/// @title NFT contract where the uri is set according to a merkle proof
contract MerkleERC721 is IMerkleERC721, ERC721URIStorage, Ownable{

    /// @dev can be set only by the contract owner
    bytes32 internal _merkleRoot; 
    
    // --  8 + 120 bits --
    bool internal _revealEnabled;
    uint120 internal _maxSupply;
    // -- 8 + 120 bits -- (128 bits free)

    /// @dev tokenId to bolean mapping expressing if the corresponding token was already revealed
    mapping (uint256 => bool) internal _tokenRevealed; 

    modifier whenRevealEnabled(){
        require(_revealEnabled, "Reveal is enabled!");
        _;
    }

    modifier whenRevealDisabled(){
        require(!_revealEnabled, "Reveal is disabled!");
        _;
    }

    /// @param tokenID was not previously revealed 
    modifier whenNotAlreadySet(uint256 tokenID){
        require(!_tokenRevealed[tokenID], "Merkle root already set!");
        _;
    }

    /// @param tokenID only token owner
    modifier onlyTokenOwner(uint256 tokenID){
        require(msg.sender == ownerOf(tokenID), "You are not the token owner!");
        _;
    }
    
    /// @param maxSupply maximum supply of nft tokens, cannot be changed later
    constructor(uint120 maxSupply) ERC721("Random", "RND") Ownable(){
        _maxSupply = maxSupply;
        _revealEnabled = false;
    }

    /// @param to address where the new nft will be minted
    /// @param tokenID id of the new toke, must not exist already
    function mintNFT(address to, uint256 tokenID) external onlyOwner{
        require(_maxSupply > 0, "Max supply reached");
        _mint(to, tokenID);
        _maxSupply--;
    }

    /// @dev fails when the proof is not valid
    /// @param tokenID token for which the uri is set
    /// @param newURI uri string that is set upon a valid proof
    /// @param proof bytes32 array expressing the path to the merkle root
    function reveal(uint256 tokenID, string calldata newURI, bytes32[] calldata proof ) external override 
                                                    onlyTokenOwner(tokenID) whenNotAlreadySet(tokenID) whenRevealEnabled{
        bytes32 digest = _calculateHash(tokenID, newURI);
        bool isValid = MerkleProof.verify(proof, _merkleRoot, digest);
        require(isValid, "Merkle proof is not valid");
        
        _setTokenURI(tokenID, newURI);
        _tokenRevealed[tokenID] = true;

        emit UpdatedURI(tokenID, newURI);
    }

    /// @param root the new bytes32 merkle root
    function setMerkleRoot(bytes32 root) external override onlyOwner whenRevealDisabled{
        _merkleRoot = root;

        emit MerkleRootUpdated(root);      
    }

    /// @dev merkle root cannot be modified after reveal is enabled
    function enableReveal() external override onlyOwner whenRevealDisabled{
        require(_merkleRoot != bytes32(0), "Merkle root not set!");
        _revealEnabled = true;
       
        emit RevealEnabled();
    }
    
    /// @return bool true if reveal is enabled
    function revealEnabled() external view override returns(bool){
        return _revealEnabled;
    }

    /// @return bytes32 root of the merkle tree
    function getMerkleRoot() external view override returns(bytes32) {
        return _merkleRoot;
    }

    /// @dev used to compute the leaf of the merkle tree
    /// @return bytes32 digest of the keccack function over the contract address, chainId, tokenId, url
    function _calculateHash(uint256 tokenID, string memory url) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(address(this) ,block.chainid, tokenID, url) // add address as param
            );
    }


}