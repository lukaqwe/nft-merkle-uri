import { task, types } from "hardhat/config";
import { MerkleERC721__factory } from "../typechain";

task("nft-deploy", "Deploy the nft contract")
  .addParam(
    "input",
    "input to metadata.json where the url for each token are",
    undefined,
    types.string
  )
  .addParam(
    "output",
    "output folder where the proof data will be generated",
    undefined,
    types.string
  )
  .setAction(
    async ({ input, output }: { input: string; output: string }, hre) => {
      // const { input, output } = args;

      const accounts = await hre.ethers.getSigners();
      const deployer = accounts[0];
      const maxSupply = 3;

      // Deploy the contract
      const merkleERCDeployment = await hre.deployments.deploy("MerkleERC721", {
        from: deployer.address,
        args: [maxSupply],
        log: true,
      });

      const address = merkleERCDeployment.address;

      console.log(
        "Contract deployed to: ",
        address,
        ",\nby account :",
        deployer.address
      );

      // Setting the merkle root
      const merkleRoot = (await hre.run("generate-merkle-proof", {
        input,
        output,
        address,
      })) as string;

      const merkleERC = MerkleERC721__factory.connect(
        merkleERCDeployment.address,
        deployer
      );
      {
        const tx = await merkleERC.setMerkleRoot(merkleRoot);
        await tx.wait(); // tx deployed here, waiting is important
        console.log("Merkle root set in transaction : ", tx.hash);
      }
      {
        for (let tokenID = 1; tokenID <= maxSupply; tokenID++) {
          const tx = await merkleERC.mintNFT(deployer.address, tokenID);
          await tx.wait();
          console.log("NFT minted in tx ", tx.hash);
        }
      }
      {
        const tx = await merkleERC.enableReveal();
        await tx.wait(); // tx deployed here, waiting is important
        console.log("Reveal enabled in tx : ", tx.hash);
      }

      // // Transferring the tokens to some random accounts
      // for(var tokenID = 1; tokenID <= initialSupply; tokenID++){
      //     const tx = await merkleERC.transferFrom(deployer.address, accounts[tokenID].address, tokenID);
      //     console.log("Token", tokenID,"transferred to", accounts[tokenID].address, "in tx:", tx.hash);
      // }
    }
  );
