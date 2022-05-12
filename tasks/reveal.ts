import { task, types } from "hardhat/config";
import { MerkleERC721__factory } from "../typechain";
import { readFileSync } from "fs";
import { RevealProofData } from "./generate-merkle-proof";

task(
  "reveal",
  "Reveal the URI of the token for all tokens available in metadata.json"
)
  .addParam(
    "input",
    "input to reveal_proofs.json where the url for each token are",
    undefined,
    types.string
  )
  .addParam(
    "address",
    "address of the MerkleERC contract",
    undefined,
    types.string
  )
  .setAction(
    async ({ input, address }: { input: string; address: string }, hre) => {
      // const { input, address } = args;

      const accounts = await hre.ethers.getSigners();

      const tokenOwner = accounts[0];

      const proofData = JSON.parse(
        readFileSync(input).toString()
      ) as Array<RevealProofData>;
      const maxSupply = proofData.length;
      const merkleERC = MerkleERC721__factory.connect(address, tokenOwner);

      for (let i = 0; i < maxSupply; i++) {
        try {
          const tx = await merkleERC.reveal(
            proofData[i].tokenID,
            proofData[i].URL,
            proofData[i].proof
          );
          console.log("Reveal in tx ", tx.hash);
        } catch (error) {
          console.log(
            "Transaction did not pass because of the following error : "
          );
          console.log(error);
        }
      }

      for (let tokenID = 1; tokenID <= maxSupply; tokenID++) {
        const uri = await merkleERC.tokenURI(tokenID);
        console.log("URI of token ", tokenID, "is", uri);
      }
    }
  );
