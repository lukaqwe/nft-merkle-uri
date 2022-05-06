import {task} from "hardhat/config";
import { readFileSync, writeFileSync} from 'fs';
import { MerkleTree } from 'merkletreejs';
import { keccak256, solidityKeccak256 } from "ethers/lib/utils";
import path from 'path';
import { mkdir } from 'fs/promises';


type RevealData = {
  tokenID: Number;
  URL: String;
}

type ProofData = Map<RevealData, Array<String>>;


function constructMerkleTree(
    inputs : Array<RevealData>,
    chainId : Number,
): [MerkleTree, ProofData] {
    
    const revealDataWithHashes = new Map<RevealData, Buffer>(); // token ID to hashes
    const allHashes = new Array<Buffer>();
    for (const input of inputs){
      const hash = constructHash(chainId, input.tokenID, input.URL);
      revealDataWithHashes.set(input, hash);
      allHashes.push(hash);
    }
    const tree = new MerkleTree(allHashes, keccak256, {sort : true});

    const proofData = new Map<RevealData, Array<String>>();
    for(const input of revealDataWithHashes.keys()){
      const hash = revealDataWithHashes.get(input)!;
      const proof = tree.getHexProof(hash);
      proofData.set(input, proof);
    }

    // console.log(proofData)

    return [tree, proofData];
}

function constructHash(chainId: Number, tokenId: Number, URL: String) : Buffer {
    const hash = solidityKeccak256(
        ['uint256', 'uint256', 'string'],
        [chainId, tokenId, URL],
      );
      // console.log(tokenId, hash);
    return Buffer.from(hash.slice(2), 'hex'); // First two characters are '0x'
}

task("generate-merkle-proof", "Generates proof.json file containing a merkle proof for each token url")
  .addParam("input", "metadata.json file that contains the url links for each tokenID")
  .addParam("output", "output folder where the proof data will be generated")
  .setAction(async (args, hre) => {
    const { input, output } = args;
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
    const [tree, proofs] = constructMerkleTree(tokenDataInput, Number(chainId));
    
    
    const basePath = path.resolve(output, `${chainId.toString()}`);
    await mkdir(basePath, { recursive: true });

    const merkleRootFilePath = path.resolve(basePath, 'merkle_root.txt');
    writeFileSync(merkleRootFilePath, tree.getHexRoot());

    const proofsAsObj: any = {};
    proofs.forEach((value, key) => {
      // console.log("KEY ", key);
      // console.log(value);

      proofsAsObj[key.tokenID.toString()] = {"url" : key.URL, "proof" : value};
    });

    const merkleProofsFilePath = path.resolve(basePath, 'reveal_proofs.json');
    writeFileSync(merkleProofsFilePath, JSON.stringify(proofsAsObj));

    return tree.getHexRoot();
});