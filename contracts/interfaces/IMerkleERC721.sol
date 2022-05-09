//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;




interface IMerkleERC721{

    // ------------- Events ------------- //
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    event UpdatedURL(uint256 tokenID, string url);
    event RevealEnabled();


    // ------------- Methods ------------- //
    function reveal(uint256 tokenID, string memory url, bytes32[] calldata proof) external;

    function enableReveal() external;

    function setMerkleRoot(bytes32 root) external;

    function getMerkleRoot() external view returns(bytes32);



}