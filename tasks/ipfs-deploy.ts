import {task} from "hardhat/config";


const NFT_STORAGE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGEzNjEwYTZiYkMxMWQxNjkwNGZBN0RiNzc2OUUwRjI0ZjE0MTBiNTQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1MTc0MDYyMzc4MSwibmFtZSI6Ik1lcmtsZU5GVCJ9.6V_5lnXW2AEmfuXMl7RjviYDMtOpiN8Jxqa4TsXXcrw";

// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from 'nft.storage'

// The 'mime' npm package helps us set the correct file type on our File objects
// import mime from 'mime'

// The 'fs' builtin module on Node.js provides access to the file system
import fs from 'fs'

// The 'path' module provides helpers for manipulating filesystem paths
import path from 'path'



/**
  * Reads an image file from `imagePath` and stores an NFT with the given name and description.
  * @param {string} imagePath the path to an image file
  * @param {string} name a name for the NFT
  * @param {string} description a text description for the NFT
  */
async function storeNFT(imagePath : string, name : string, description : string) {
    // load the file from disk
    const image = await fileFromPath(imagePath)

    // create a new NFTStorage client using our API key
    const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY })

    // call client.store, passing in the image & metadata
    return nftstorage.store({
        image,
        name,
        description,
    })
}

/**
  * A helper to read a file from a location on disk and return a File object.
  * Note that this reads the entire file into memory and should not be used for
  * very large files. 
  * @param {string} filePath the path to a file to store
  * @returns {File} a File object containing the file content
  */
async function fileFromPath(filePath : string) {
    const content = await fs.promises.readFile(filePath)
    const type = mime.getType(filePath)
    return new File([content], path.basename(filePath), { type })
}




task('ipfs-deploy')
    .addParam("input", "Folder where the NFTs are")
    .addParam("output", "path where the metadata.json file will be generated")
    .setAction(async (args, hre) => {
        const {input, output} = args;

        fs.readdir(input, (err, files) => {
            files.forEach((file) => {
                console.log(file)
            })       
        })

    }



    });

