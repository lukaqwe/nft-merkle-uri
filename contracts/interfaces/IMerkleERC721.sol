//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;




interface IMerkleERC721{

    // ------------- Events ------------- //
    event MerkleRootUpdated(bytes32 indexed newMerkleRoot);
    event UpdatedURI(uint256 indexed tokenID, string indexed urI);
    event RevealEnabled();


    // ------------- Methods ------------- //
    function reveal(uint256 tokenID, string memory uri, bytes32[] calldata proof) external;

    function enableReveal() external;

    function revealEnabled() external view returns(bool);

    function setMerkleRoot(bytes32 root) external;

    function getMerkleRoot() external view returns(bytes32);



}