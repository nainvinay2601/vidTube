// so we want to design a way simple method where we want to provide a url and file path basically -> that file path goes to the cloudinary
//step-01 -> Configure the cloudinary
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //101 node

import dotenv from "dotenv";

dotenv.config();

//Configure Cloudinary

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

// we provide it a location to the file that multer output will give us
const uploadOnCloudinary = async (localFilePath) => {
  try {
    //1 -if no path we dont wanna proceed

    // console.log("Cloudinary Config:", {
    //   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    //   api_key: process.env.CLOUDINARY_API_KEY,
    //   api_secret: process.env.CLOUDINARY_API_SECRET,
    // });

    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("FILE UPLOADED ON CLOUDINARY. FILE SRC:  " + response.url);

    //once file is uploaded we will delete it from our localDiskStorage where multer saved it
    fs.unlinkSync(localFilePath);
    return response; // can use this for video and different types as video gives us time and all
  } catch (error) {
    console.log("Error On Cloudinary", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

//Delete the resource

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted from the cloudinary :)", publicId);
  } catch (error) {
    console.log("Error Deleting From Cloudindary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
