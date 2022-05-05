import {task} from "hardhat/config";



task('nft-deploy', "Deploy the nft contract")
    .addParam("input", "input to proofs.json where the proofs for each token url are")
    .setAction(async (args, hre) => {
        const {input} = args;
        
    });