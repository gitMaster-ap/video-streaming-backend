import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = (localFilePath) => {
  return new Promise((resolve, reject) => {
    if (!localFilePath) {
      reject("Local file path is required");
    }
    const cloudinaryStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "backend Storage" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    const fileStream = fs.createReadStream(localFilePath);
    fileStream.pipe(cloudinaryStream);
  });
};

const deleteFromCloudinary = async (url) => {
  if (!url) {
    throw new ApiError(400, "Url is missing");
  }
  try {
    const publicId = url.split("/").pop().split(".")[0];
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(error.statusCode || 500, error.message);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
