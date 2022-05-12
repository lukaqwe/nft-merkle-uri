import { task, types } from "hardhat/config";

// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File, TokenType } from "nft.storage";

// The 'mime' npm package helps us set the correct file type on our File objects
import mime from "mime";

// The 'fs' builtin module on Node.js provides access to the file system
import fs from "fs";

import { mkdir } from "fs/promises";

// The 'path' module provides helpers for manipulating filesystem paths
import path from "path";
import { RevealData } from "./generate-merkle-proof";

// type TokenType = Token<{
//   image: File;
//   name: string;
//   description: string;
// }>

/**
 * Reads an image file from `imagePath` and stores an NFT with the given name and description.
 * @param {string} imagePath the path to an image file
 * @param {string} name a name for the NFT
 * @param {string} description a text description for the NFT
 */

const storeNFT = async function (
  imagePath: string,
  name: string,
  description: string,
  API_KEY: string
): Promise<
  TokenType<{
    image: File;
    name: string;
    description: string;
  }>
> {
  // load the file from disk
  const image = await fileFromPath(imagePath);

  // create a new NFTStorage client using our API key
  const nftstorage = new NFTStorage({ token: API_KEY });

  // call client.store, passing in the image & metadata
  // const url = (await token).url;
  // console.log("URL =", url);
  return nftstorage.store({
    image,
    name,
    description,
  });
};

/**
 * A helper to read a file from a location on disk and return a File object.
 * Note that this reads the entire file into memory and should not be used for
 * very large files.
 * @param {string} filePath the path to a file to store
 * @returns {File} a File object containing the file content
 */
const fileFromPath = async function (filePath: string): Promise<File> {
  const content = await fs.promises.readFile(filePath);
  const type = mime.getType(filePath)!;
  return new File([content], path.basename(filePath), { type });
};

task("ipfs-deploy")
  .addParam("input", "Folder where the NFTs are", undefined, types.string)
  .addParam(
    "output",
    "path where the metadata.json file will be generated",
    undefined,
    types.string
  )
  .addParam("key", "API key for nft.storage", undefined, types.string)
  .setAction(
    async ({
      input,
      output,
      key,
    }: {
      input: string;
      output: string;
      key: string;
    }) => {
      // const { input, output, key } = args;

      const files = fs.readdirSync(input);
      const metadataAsObj = new Array<RevealData>();

      for (const file of files) {
        const tokenID = file.split(".")[0];
        const token = await storeNFT(input + file, file, tokenID, key);
        const url = token.url;
        metadataAsObj.push({ tokenID: Number(tokenID), URL: url });
        console.log("URL of token", tokenID, "is:", url);
      }

      const basePath = path.resolve(output);
      await mkdir(basePath, { recursive: true });
      const metadataFilePath = path.resolve(basePath, "metadata.json");
      fs.writeFileSync(metadataFilePath, JSON.stringify(metadataAsObj));
    }
  );
