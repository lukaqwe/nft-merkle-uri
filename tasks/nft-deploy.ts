import {task} from "hardhat/config";
import { MerkleERC721__factory } from "../typechain";
// import {hre} from "@nomiclabs/hardhat-ethers";


task('nft-deploy', "Deploy the nft contract")
    .addParam("input", "input to metadata.json where the url for each token are")
    .addParam("output", "output folder where the proof data will be generated")
    .setAction(async (args, hre) => {
        const {input, output} = args;
        
        const accounts = await hre.ethers.getSigners();
        const deployer = accounts[0];
        const initialSupply = 3;


        // Deploy the contract
        const merkleERCDeployment = await hre.deployments.deploy('MerkleERC721', {
            from: deployer.address,
            args: [initialSupply],
            log: true,
        });

        console.log("Contract deployed to: ", merkleERCDeployment.address, ",\nby account :", deployer.address);
        
        // Setting the merkle root
        const merkleRoot = (await hre.run('generate-merkle-proof', {
            input,
            output,
        })) as string;

        const merkleERC = MerkleERC721__factory.connect(merkleERCDeployment.address, deployer);
        {
            const tx = await merkleERC.setMerkleRoot(merkleRoot);
            console.log("Merkle root set in transaction : ", tx.hash);
        }
        
        // // Transferring the tokens to some random accounts
        // for(var tokenID = 1; tokenID <= initialSupply; tokenID++){
        //     const tx = await merkleERC.transferFrom(deployer.address, accounts[tokenID].address, tokenID);
        //     console.log("Token", tokenID,"transferred to", accounts[tokenID].address, "in tx:", tx.hash);
        // }


    });