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
