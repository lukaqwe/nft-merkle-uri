import {task} from "hardhat/config";


task('ipfs-deploy')
    .addParam("input", "Folder where the NFTs are")
    .addParam("output", "path where the metadata.json file will be generated")
    .setAction(async (args, hre) => {
        const {input, output} = args;
        



    });

