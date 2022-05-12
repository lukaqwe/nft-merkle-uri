import { task, types } from "hardhat/config";
import { readFileSync, writeFileSync } from "fs";
import { MerkleTree } from "merkletreejs";
import { keccak256, solidityKeccak256 } from "ethers/lib/utils";
import path from "path";
import { mkdir } from "fs/promises";

export type RevealData = {
  tokenID: number;
  URL: string;
};

export type ProofsWithUrl = {
  URL: string;
  proof: Array<string>;
};

export type RevealProofData = {
  tokenID: number;
  URL: string;
  proof: Array<string>;
};

export type ProofInfo = Map<number, ProofsWithUrl>;
// export type ProofData = Map<RevealData, Array<string>>;

export const constructMerkleTree = function (
  inputs: Array<RevealData>,
  chainId: number,
  address: string
): [MerkleTree, ProofInfo] {
  const revealDataWithHashes = new Map<RevealData, Buffer>(); // token ID to hashes
  const allHashes = new Array<Buffer>();
  for (const input of inputs) {
    const hash = constructHash(chainId, input.tokenID, input.URL, address);
    revealDataWithHashes.set(input, hash);
    allHashes.push(hash);
  }
  const tree = new MerkleTree(allHashes, keccak256, { sort: true });

  const proofData = new Map<number, ProofsWithUrl>();
  for (const input of revealDataWithHashes.keys()) {
    const hash = revealDataWithHashes.get(input)!;
    const proof = tree.getHexProof(hash);
    proofData.set(input.tokenID, { URL: input.URL, proof: proof });
  }

  // console.log(proofData)

  return [tree, proofData];
};

const constructHash = function (
  chainId: number,
  tokenId: number,
  URL: string,
  address: string
): Buffer {
  const hash = solidityKeccak256(
    ["address", "uint256", "uint256", "string"],
    [address, chainId, tokenId, URL]
  );
  // console.log(tokenId, hash);
  return Buffer.from(hash.slice(2), "hex"); // First two characters are '0x'
};

task(
  "generate-merkle-proof",
  "Generates proof.json file containing a merkle proof for each token url"
)
  .addParam(
    "input",
    "metadata.json file that contains the url links for each tokenID"
  )
  .addParam(
    "output",
    "output folder where the proof data will be generated",
    undefined,
    types.string
  )
  .addParam(
    "address",
    "address of the MerkleERC721 contract.",
    undefined,
    types.string
  )
  .setAction(
    async (
      {
        input,
        output,
        address,
      }: { input: string; output: string; address: string },
      hre
    ) => {
      const metadata = JSON.parse(
        readFileSync(input).toString()
      ) as Array<RevealData>;

      const chainId = await hre.getChainId();
      // console.log("Chain ID =", chainId);
      // console.log(metadata);

      const tokenDataInput = new Array<RevealData>();
      for (let i = 0; i < metadata.length; i++) {
        // console.log(metadata[i]);
        tokenDataInput.push({
          tokenID: metadata[i].tokenID,
          URL: metadata[i].URL,
        });
      }

      // console.log(tokenDataInput);
      const [tree, proofs] = constructMerkleTree(
        tokenDataInput,
        Number(chainId),
        address
      );

      const basePath = path.resolve(output, `${chainId.toString()}`);
      await mkdir(basePath, { recursive: true });

      const merkleRootFilePath = path.resolve(basePath, "merkle_root.txt");
      writeFileSync(merkleRootFilePath, tree.getHexRoot());

      const proofObj = new Array<RevealProofData>();

      proofs.forEach((value, key) => {
        proofObj.push({ tokenID: key, URL: value.URL, proof: value.proof });
      });

      const merkleProofsFilePath = path.resolve(basePath, "reveal_proofs.json");
      writeFileSync(merkleProofsFilePath, JSON.stringify(proofObj));

      return tree.getHexRoot();
    }
  );
