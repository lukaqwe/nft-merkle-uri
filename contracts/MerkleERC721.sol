//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


import "./interfaces/IMerkleERC721.sol";

/// @author lukaqwe
/// @title NFT contract where the uri is set according to a merkle proof
contract MerkleERC721 is IMerkleERC721, ERC721URIStorage, Ownable{

    /// @dev Merkle root used for validating proofs, can be set only by the contract owner
    bytes32 internal _merkleRoot; 
    
    // --  8 + 120 bits --
    bool internal _revealEnabled;
    uint120 internal _maxSupply;
    // -- 8 + 120 bits -- (128 bits free)

    /// @dev tokenId to bolean mapping expressing if the corresponding token was already revealed
    mapping (uint256 => bool) internal _tokenRevealed; 

    /**
     * @dev Modifier to allow transaction only when reveal is enabled
     */
    modifier whenRevealEnabled(){
        require(_revealEnabled, "Reveal is enabled!");
        _;
    }

    /**
     * @dev Modifier to allow transaction only when reveal is disabled
     */
    modifier whenRevealDisabled(){
        require(!_revealEnabled, "Reveal is disabled!");
        _;
    }

    /**
     * @dev Modifier to allow reveal if it wasn't performed before
     * @param tokenID Token to query 
     */
    modifier whenNotAlreadySet(uint256 tokenID){
        require(!_tokenRevealed[tokenID], "Merkle root already set!");
        _;
    }

    /**
     * @dev Modifier to allow the transaction only to the token owner
     * @param tokenID Owner of this token
     */
    modifier onlyTokenOwner(uint256 tokenID){
        require(msg.sender == ownerOf(tokenID), "You are not the token owner!");
        _;
    }
    
    /**
     * @dev Constructor sets the max supply and puts reveal disabled by defaults
     * @param maxSupply Maximum supply of nft tokens, cannot be changed later
     */
    constructor(uint120 maxSupply) ERC721("Random", "RND") Ownable(){
        _maxSupply = maxSupply;
        _revealEnabled = false;
    }

    /**
     * @dev Function to mint a token
     * @param to Address where the new nft will be minted
     * @param tokenID Id of the new token, must not exist already
     */
    function mintNFT(address to, uint256 tokenID) external onlyOwner{
        require(_maxSupply > 0, "Max supply reached");
        _mint(to, tokenID);
        _maxSupply--;
    }

    /**
     * @inheritdoc IMerkleERC721
     */
    function reveal(uint256 tokenID, string calldata newURI, bytes32[] calldata proof ) external override 
                                                    onlyTokenOwner(tokenID) whenNotAlreadySet(tokenID) whenRevealEnabled{
        bytes32 digest = _calculateHash(tokenID, newURI);
        bool isValid = MerkleProof.verify(proof, _merkleRoot, digest);
        require(isValid, "Merkle proof is not valid");
        
        _setTokenURI(tokenID, newURI);
        _tokenRevealed[tokenID] = true;

        emit UpdatedURI(tokenID, newURI);
    }

    /**
     * @inheritdoc IMerkleERC721
     */
    function setMerkleRoot(bytes32 root) external override onlyOwner whenRevealDisabled{
        _merkleRoot = root;

        emit MerkleRootUpdated(root);      
    }

    /**
     * @inheritdoc IMerkleERC721
     */
    function enableReveal() external override onlyOwner whenRevealDisabled{
        require(_merkleRoot != bytes32(0), "Merkle root not set!");
        _revealEnabled = true;
       
        emit RevealEnabled();
    }
    
    /**
     * @inheritdoc IMerkleERC721
     */
    function revealEnabled() external view override returns(bool){
        return _revealEnabled;
    }

    /**
     * @inheritdoc IMerkleERC721
     */ 
    function getMerkleRoot() external view override returns(bytes32) {
        return _merkleRoot;
    }

    /**
     * @dev used to compute the leaf of the merkle tree
     * @return bytes32 digest of the keccack function over the contract address, chainId, tokenId, url
     */
    function _calculateHash(uint256 tokenID, string memory url) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(address(this) ,block.chainid, tokenID, url) // add address as param
            );
    }


}