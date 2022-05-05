//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;




interface IMerkleERC721{

    // ------------- Events ------------- //
    event MerkleRootUpdated(uint256 tokenID, bytes32 newMerkleRoot);
    event UpdatedURL(uint256 tokenID, string url);



    // ------------- Methods ------------- //
    function changeURI(uint256 tokenID, string memory url, bytes32[] calldata proof) external;

    function setMerkleRoot(uint256 tokenID, bytes32 root) external;

    function getMerkleRoot(uint256 tokenID) external view returns(bytes32);



}