import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload got unsuccessful
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload got unsuccessful
    return null;
  }
};

// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );

const deleteFromCloudinary = async (url) => {
  try {
    if (!url) {
      return ApiError(400, "Url is missing");
    }
    const urlParts = url.split("/");
    const publicId = urlParts[urlParts.length - 1].split(".")[0];
    return cloudinary.uploader.destroy(publicId);
  } catch (error) {}
};

export { uploadOnCloudinary, deleteFromCloudinary };
