import {task} from "hardhat/config";
import { readFileSync, writeFileSync } from 'fs';
import { MerkleTree } from 'merkletreejs';
import { solidityKeccak256 } from "ethers/lib/utils";
import { string } from "hardhat/internal/core/params/argumentTypes";

type tokenData = {
  tokenID: Number;
  URLs: Array<String>;
}

type tokenProofData = {
  merkleRoot: String;
  proofPerUrl: Map<string, Array<String>>;
}

type proofData = Map<Number, tokenProofData>;

function constructMerkleTree(
    inputs : Array<tokenData>,
    chainId : Number,
)  {
    
    let tokenLeaves = new Map< Number, Array<String>>(); // token ID to URL hashes
    for (const input of inputs){
      const _tokenID = input.tokenID;
      input.URLs.forEach( (e:String) => (
        e.toUpperCase()
        // constructHash(chainId : Number, _tokenID: Number , e: String)
      ));
      
    }

    console.log(inputs);   
}

function constructHash(chainId: Number, tokenId: Number, URL: String) {
    const hash = solidityKeccak256(
        ['uint256', 'uint256', 'string'],
        [chainId, tokenId, URL],
      );
      console.log(hash);
    return Buffer.from(hash.slice(2), 'hex'); // First two characters are '0x'
}

task(
  "generate-merkle-proof",
  "Generates proof.json file containing a merkle proof for each token url"
)
  .addParam(
    "input",
    "metadata.json file that contains the url links for each tokenID")
    .setAction(async (args, hre) => {
    const { input } = args;
        const metadata = JSON.parse(readFileSync(input).toString());
        
        hre.getChainId();
        const chainId = hre.network.config.chainId == undefined ? 0 : hre.network.config.chainId;
        console.log("Chain ID =", chainId);

        let tokenDataInput  = new Array<tokenData>();
        for (let i = 1; i <= 3; i++) {
            // console.log(metadata[i]);
            tokenDataInput.push({
                tokenID : i,
                URLs : metadata[i],
            });
        }

        console.log(tokenDataInput);
        constructMerkleTree(tokenDataInput, chainId);
        // const [tree, proof] = constructMerkleTree(tokenDataInput, chainId);
        // const hash = constructHash(chainId, 1, "ipfs://bafkreigo3pws356f5femwbjdo5d4sjibixqehqtemfcvk5vvvsnmnas2pq");


        // const [tree, proofs] = constructMerkleTree




    });