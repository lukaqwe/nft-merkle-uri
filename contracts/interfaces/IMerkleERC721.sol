//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IMerkleERC721{

    // ------------- Events ------------- //
    
    /**
     * @dev Emitted when the setMerkleRoot function is called
     * @param newMerkleRoot The merkle root
     */
    event MerkleRootUpdated(bytes32 indexed newMerkleRoot);

    /** 
     * @dev Emitted when the reveal function is called
     * @param tokenID Token that has been revealed
     * @param uri The uri address that is set
     */
    event UpdatedURI(uint256 indexed tokenID, string indexed uri);

    /**
     * @dev Emitted when reveal is enabled by the contract owner
    */
    event RevealEnabled();


    // ------------- Methods ------------- //

    /**
     * @dev Function that sets the new uri for a specific token, fails when the merkle proof is not valid
     * @param tokenID Token for which the uri is set
     * @param uri Uri string that is set upon a valid proof
     * @param proof Bytes array expressing the path to the merkle root
     */
    function reveal(uint256 tokenID, string memory uri, bytes32[] calldata proof) external;

    /**  
     * @dev Sets the merkle root, performed only by the contract owner
     * @param root The new bytes32 merkle root
     */
    function setMerkleRoot(bytes32 root) external;

    /**
     * @dev Enables revealing, performed only by the contract owner, merkle root cannot be modified after
     */
    function enableReveal() external;

    /**
     * @dev Getter function to see if reveal is enabled
     * @return bool True if reveal is enabled
     */
    function revealEnabled() external view returns(bool);

    /**
     * @dev Getter function for the merkle root
     * @return bytes32 Root of the merkle tree
     */
    function getMerkleRoot() external view returns(bytes32);
}