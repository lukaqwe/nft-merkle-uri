import {task} from "hardhat/config";
import { readFileSync, writeFileSync} from 'fs';
import { MerkleTree } from 'merkletreejs';
import { keccak256, solidityKeccak256 } from "ethers/lib/utils";
import path from 'path';
import { mkdir } from 'fs/promises';


export type RevealData = {
  tokenID: Number;
  URL: string;
}

export type ProofsWithUrl  = {
  URL : string;
  Proof :  Array<string>
}

export type ProofInfo = Map<Number, ProofsWithUrl>
export type ProofData = Map<RevealData, Array<String>>;


export function constructMerkleTree(
  inputs : Array<RevealData>,
  chainId : Number,
  address : String,
): [MerkleTree, ProofInfo] {
  
  const revealDataWithHashes = new Map<RevealData, Buffer>(); // token ID to hashes
  const allHashes = new Array<Buffer>();
  for (const input of inputs){
    const hash = constructHash(chainId, input.tokenID, input.URL, address);
    revealDataWithHashes.set(input, hash);
    allHashes.push(hash);
  }
  const tree = new MerkleTree(allHashes, keccak256, {sort : true});

  const proofData = new  Map<Number, ProofsWithUrl>();
  for(const input of revealDataWithHashes.keys()){
    const hash = revealDataWithHashes.get(input)!;
    const proof = tree.getHexProof(hash);
    proofData.set(input.tokenID, {URL : input.URL , Proof : proof});
  }

  // console.log(proofData)

  return [tree, proofData];
}

function constructHash(chainId: Number, tokenId: Number, URL: String, address : String) : Buffer {
    const hash = solidityKeccak256(
        ['address','uint256', 'uint256', 'string'],
        [address, chainId, tokenId, URL],
      );
      // console.log(tokenId, hash);
    return Buffer.from(hash.slice(2), 'hex'); // First two characters are '0x'
}

task("generate-merkle-proof", "Generates proof.json file containing a merkle proof for each token url")
  .addParam("input", "metadata.json file that contains the url links for each tokenID")
  .addParam("output", "output folder where the proof data will be generated")
  .addParam("address", "address of the MerkleERC721 contract.")
  .setAction(async (args, hre) => {
    const { input, output, address } = args;
    const metadata = JSON.parse(readFileSync(input).toString());
    
    
    const chainId = await hre.getChainId();
    console.log("Chain ID =", chainId);
    // console.log(metadata);

    let tokenDataInput  = new Array<RevealData>();
    for (let i = 1; i <= 3; i++) {
        // console.log(metadata[i]);
        tokenDataInput.push({
            tokenID : i,
            URL : metadata[i],
        });
    }

    // console.log(tokenDataInput);
    const [tree, proofs] = constructMerkleTree(tokenDataInput, Number(chainId), address);
    
    
    const basePath = path.resolve(output, `${chainId.toString()}`);
    await mkdir(basePath, { recursive: true });

    const merkleRootFilePath = path.resolve(basePath, 'merkle_root.txt');
    writeFileSync(merkleRootFilePath, tree.getHexRoot());

    const proofsAsObj: any = {};
    proofs.forEach((value, key) => {
      // console.log("KEY ", key);
      // console.log(value);

      proofsAsObj[key.toString()] = {"url" : value.URL, "proof" : value.Proof};
    });

    const merkleProofsFilePath = path.resolve(basePath, 'reveal_proofs.json');
    writeFileSync(merkleProofsFilePath, JSON.stringify(proofsAsObj));

    return tree.getHexRoot();
});