import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ApiError } from "./apiError.js";
import path from "path";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadOnS3 = async ({ file, fileType }) => {
  try {
    const fileName = path.basename(file);
    const fileKey = Date.now() + "-" + fileName;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: fs.createReadStream(file),
      ContentType: fileType,
    };
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
    fs.unlink(file, (err) => {
      if (err) console.error(`Error deleting file ${file}:`, err);
      else console.log(`Successfully deleted local file ${file}`);
    });
    return { data, fileKey };
  } catch (error) {
    fs.unlink(file, (err) => {
      if (err) console.error(`Error deleting file ${file}:`, err);
      else console.log(`Successfully deleted local file ${file}`);
    });
    throw new ApiError(error.statusCode, error.message);
  }
};

export { uploadOnS3 };
