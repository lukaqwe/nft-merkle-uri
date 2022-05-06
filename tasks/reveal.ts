import {task} from "hardhat/config";
import { MerkleERC721__factory } from "../typechain";
import {readFileSync} from 'fs';
import { url } from "inspector";
import { BigNumber } from "ethers";
// import {hre} from "@nomiclabs/hardhat-ethers";


task('reveal', "Reveal the URI of the token for all tokens available in metadata.json")
    .addParam("input", "input to reveal_proofs.json where the url for each token are")
    .addParam("address", "address of the MerkleERC contract")
    .setAction(async (args, hre) => {
        const {input, address} = args;

        const accounts = await hre.ethers.getSigners();
        const initialSupply = 3;
        const tokenOwner = accounts[0];

        const proofData = JSON.parse(readFileSync(input).toString());

        const merkleERC = MerkleERC721__factory.connect(address, tokenOwner);

        for(let tokenID = 1; tokenID <= initialSupply; tokenID++ ){
            try {
                const tx = await merkleERC.reveal(tokenID, proofData[tokenID]["url"], proofData[tokenID]["proof"]);
                console.log("Reveal in tx ", tx.hash);
            } catch (error) {
                console.log("Transaction did not pass because of the following error : ")
                console.log(error);
            }
            
        }
        
        for(let tokenID = 1; tokenID <= initialSupply; tokenID++ ){

            const uri = await merkleERC.tokenURI(tokenID);
            console.log("URI of token ", tokenID, "is", uri);
        }

        // Retrying to see if transaction fails
        // for(let tokenID = 1; tokenID <= initialSupply; tokenID++ ){
        //     try {
        //         const tx = await merkleERC.reveal(tokenID, proofData[tokenID]["url"], proofData[tokenID]["proof"]);
        //         console.log("Transaction passed on the second run, not good");
        //     } catch (error) {
        //         console.log("All good")
        //     }
        // }
        
    

    })