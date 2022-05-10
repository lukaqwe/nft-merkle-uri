import { expect } from "chai";
import { ethers, network } from "hardhat";
import { readFileSync } from "fs";
import { MerkleERC721__factory, MerkleERC721 } from "../typechain";
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

// import * as data from "../metadata.json";
import {constructMerkleTree, RevealData, ProofData, ProofInfo} from "../tasks/generate-merkle-proof";
import MerkleTree from "merkletreejs";

import "../metadata.json";

describe("merkleERC721 testing suite", function () {
  let deployer: SignerWithAddress;
  let stranger: SignerWithAddress;
  let chainId = network.config.chainId!;
  let merkleERC : MerkleERC721;
  let tree : MerkleTree;
  let proofData : ProofInfo;
  let data : any;
  const maxSupply = 3;
  
  beforeEach(async () => { 
    deployer = (await ethers.getSigners())[0];
    
    // parsing the input
    const data = JSON.parse(readFileSync("metadata.json").toString());
    let tokenDataInput  = new Array<RevealData>();
    for (let i = 1; i <= maxSupply; i++) {
        tokenDataInput.push({
            tokenID : i,
            URL : data[i],
        });
    }
    
    // Deploying the contract
    merkleERC = await new MerkleERC721__factory(deployer).deploy(maxSupply);
    
    // Computing the merkle tree  
    [tree, proofData] = constructMerkleTree(tokenDataInput, chainId, merkleERC.address)

    // Minting some tokens
    for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
      const tx = await merkleERC.mintNFT(deployer.address, tokenID);
      await tx.wait();
    }
  })

  describe("When merkle root not set", async ()=>{

    it("Has the bytes32('0x') merkle root",async () => {
      // console.log(await merkleERC.getMerkleRoot());
      expect(await merkleERC.getMerkleRoot()).to.equal(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    })

    it("Reveal is disabled",async () => {
      expect(await merkleERC.revealEnabled()).to.eq(false);
    })

    it("Reveal cannot be enabled",async () => {
      await expect(merkleERC.enableReveal()).to.be.reverted;
    })

    it("Stranger cannot set merkle root", async () => {
      await expect(merkleERC.connect(stranger).setMerkleRoot(tree.getHexRoot())).to.be.reverted;
    })
    
    it("Owner can set the merkle root",async () => {
      const tx = await merkleERC.connect(deployer).setMerkleRoot(tree.getHexRoot());
      await tx.wait();
      expect(await merkleERC.getMerkleRoot()).to.eq(tree.getHexRoot());
      await expect(tx).to.emit(merkleERC, "MerkleRootUpdated").withArgs(tree.getHexRoot());
    })

    it("Minting fails when when max supply reached",async () => {
      const tokenID = maxSupply + 1;
      await expect(merkleERC.mintNFT(deployer.address, tokenID)).to.be.reverted;
    })
  })

  describe("When merkle root set", async ()=> {

    beforeEach(async () => {
      const tx = await merkleERC.connect(deployer).setMerkleRoot(tree.getHexRoot());
      await tx.wait();
    })

    it("Merkle root can be set again",async () => {
      const tx = await merkleERC.setMerkleRoot(tree.getHexRoot());
      await tx.wait();
      expect(await merkleERC.getMerkleRoot()).to.eq(tree.getHexRoot());
      await expect(tx).to.emit(merkleERC, "MerkleRootUpdated").withArgs(tree.getHexRoot());
    })

    it("Reveal cannot be enabled by stranger", async () => {
      await expect(merkleERC.connect(stranger).enableReveal()).to.be.reverted;
    })

    it("Reveal can be enabled by owner",async () => {
      const tx = await merkleERC.enableReveal();
      await tx.wait();
      expect(await merkleERC.revealEnabled()).to.eq(true);
      await expect(tx).to.emit(merkleERC, "RevealEnabled");
    })

    context("When reveal enabled",async () => {
      beforeEach(async () => {
        const tx = await merkleERC.enableReveal();
        await tx.wait();
      })

      it("Reveal cannot be enabled twice",async () => {
        await expect(merkleERC.enableReveal()).to.be.reverted;
      })

      it("Merkle root cannot be set again",async () => {
        await expect(merkleERC.setMerkleRoot(tree.getHexRoot())).to.be.reverted;
      })

      it("Reveal fails with invalid url",async () => {
        for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
            const proof = proofData.get(tokenID)!.Proof;
            await expect(merkleERC.reveal(tokenID, "abcdef", proof)).to.be.reverted;
          }
      })

      it("Reveal fails with invalid proof",async () => {
        for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
            const proof = ['0x0000000000000000000000000000000000000000000000000000000000000000'];
            const url = proofData.get(tokenID)!.URL;
            await expect(merkleERC.reveal(tokenID, url, proof)).to.be.reverted;
          }
      })
         
      it("Reveal with valid proof fails at second attempt", async () => {
        for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
            const proof = proofData.get(tokenID)!.Proof;
            const url = proofData.get(tokenID)!.URL;
            const tx = await merkleERC.reveal(tokenID, url, proof);
            await tx.wait();
          }

          for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
            const proof = proofData.get(tokenID)!.Proof;
            const url = proofData.get(tokenID)!.URL;
            await expect(merkleERC.reveal(tokenID, url, proof)).to.be.reverted;
          }
      })

      it("Reveal fails if not called by the token owner",async () => {
        for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
          const proof = proofData.get(tokenID)!.Proof;
          const url = proofData.get(tokenID)!.URL;
          await expect(merkleERC.connect(stranger).reveal(tokenID, url, proof)).to.be.reverted;
        }
      })

      it("Reveal fails for unexisting token",async () => {
        const tokenID = maxSupply + 1;
        const proof = proofData.get(tokenID - 1)!.Proof;
        const url = proofData.get(tokenID - 1)!.URL;
        await expect(merkleERC.reveal(tokenID, url, proof)).to.be.reverted;
      })

      it("Reveal succedes with valid proof", async () => {
        for(let tokenID = 1; tokenID <=maxSupply; tokenID++){ 
            const proof = proofData.get(tokenID)!.Proof;
            const url = proofData.get(tokenID)!.URL;
            const tx = await merkleERC.reveal(tokenID, url, proof);
            await tx.wait();
            await expect(tx).to.emit(merkleERC, "UpdatedURL").withArgs(tokenID, url);
          }
      })

    })

  })
});