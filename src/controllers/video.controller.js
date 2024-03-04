import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import mongoose, { isValidObjectId } from "mongoose";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Playlist } from "../models/playlist.model.js";
import { uploadOnS3 } from "../utils/s3BucketUpload.js";
import fs from "fs";

const publishVideoOnCloudinary = asyncHandler(async (req, res) => {
  try {
    const { title, description, isPublished } = req.body;

    if (!title?.trim()) {
      throw new ApiError(400, "Title content is required");
    }
    if (!description?.trim()) {
      throw new ApiError(400, "Description content is required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const videoThumbnail = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
      throw new ApiError(400, "Video file is required");
    }
    if (!videoThumbnail) {
      throw new ApiError(400, "Thumbnail file is required");
    }
    const [uploadVideo, uploadThumbnail] = await Promise.all([
      uploadOnCloudinary(videoLocalPath),
      uploadOnCloudinary(videoThumbnail),
    ]);

    if (!uploadVideo || !uploadThumbnail) {
      throw new ApiError(500, "Something went wrong while uploading video");
    }

    const video = await Video.create({
      videoFile: uploadVideo?.url,
      thumbnail: uploadThumbnail?.url,
      title,
      description,
      isPublished,
      owner: req.user._id,
      duration: uploadVideo?.duration ?? null,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video uploaded successfully!!"));
  } catch (error) {
    if (fs.existsSync(req.files?.videoFile?.[0]?.path)) {
      fs.unlinkSync(req.files?.videoFile?.[0]?.path);
    }
    if (fs.existsSync(req.files?.thumbnail?.[0]?.path)) {
      fs.unlinkSync(req.files?.thumbnail?.[0]?.path);
    }
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while uploading video"
        )
      );
  }
});

const publishVideoOnS3 = asyncHandler(async (req, res) => {
  try {
    const { title, description, isPublished } = req.body;
    if (!title?.trim()) {
      throw new ApiError(400, "Title content is required");
    }
    if (!description?.trim()) {
      throw new ApiError(400, "Description content is required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const videoThumbnail = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
      throw new ApiError(400, "Video file is required");
    }
    if (!videoThumbnail) {
      throw new ApiError(400, "Thumbnail file is required");
    }
    const [uploadVideo, uploadThumbnail] = await Promise.all([
      uploadOnS3({
        file: videoLocalPath,
        fileType: req.files?.videoFile[0].mimetype,
      }),
      uploadOnS3({
        file: videoThumbnail,
        fileType: req.files?.thumbnail[0].mimetype,
      }),
    ]);
    if (!uploadVideo || !uploadThumbnail) {
      throw new ApiError(500, "Something went wrong while uploading video");
    }
    const video = await Video.create({
      videoFile: uploadVideo?.url,
      thumbnail: uploadThumbnail?.url,
      title,
      description,
      isPublished,
      owner: req.user._id,
      duration: null,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video uploaded successfully!!"));
  } catch (error) {
    if (fs.existsSync(req.files?.videoFile?.[0]?.path)) {
      fs.unlinkSync(req.files?.videoFile?.[0]?.path);
    }
    if (fs.existsSync(req.files?.thumbnail?.[0]?.path)) {
      fs.unlinkSync(req.files?.thumbnail?.[0]?.path);
    }
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while uploading video"
        )
      );
  }
});
const getAllVideos = asyncHandler(async (req, res) => {
  try {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Validate and adjust page and limit values
    page = Math.max(1, page); // Ensure page is at least 1
    limit = Math.min(20, Math.max(1, limit)); // Ensure limit is between 1 and 20

    const pipeline = [];

    // Match videos by owner userId if provided
    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiError(400, "userId is invalid");
      }

      pipeline.push({
        $match: {
          owner: mongoose.Types.ObjectId(userId),
        },
      });
    }

    // Match videos based on search query
    if (query) {
      pipeline.push({
        $match: {
          $text: {
            $search: query,
          },
        },
      });
    }

    // Sort pipeline stage based on sortBy and sortType
    const sortCriteria = {};
    if (sortBy && sortType) {
      sortCriteria[sortBy] = sortType === "asc" ? 1 : -1;
      pipeline.push({
        $sort: sortCriteria,
      });
    } else {
      // Default sorting by createdAt if sortBy and sortType are not provided
      sortCriteria["createdAt"] = -1;
      pipeline.push({
        $sort: sortCriteria,
      });
    }

    // Apply pagination using skip and limit
    pipeline.push({
      $skip: (page - 1) * limit,
    });
    pipeline.push({
      $limit: limit,
    });

    // Execute aggregation pipeline
    const Videos = await Video.aggregate(pipeline);

    if (!Videos || Videos.length === 0) {
      throw new ApiError(404, "Videos not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Videos fetched Successfully", Videos));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId) {
      throw new ApiError(400, "Video Id is required");
    }
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Video Id is invalid");
    }
    const video = await Video.findById(videoId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Video fetched successfully", video));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching video"
        )
      );
  }
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId, title, description } = req.body;
  try {
    if (!videoId) {
      throw new ApiError(400, "Video Id is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (req.files?.videoFile?.[0]) {
      const oldVideoPath = video.videoFile;
      const uploadVideo = await uploadOnCloudinary(
        req.files?.videoFile?.[0]?.path
      );
      if (uploadVideo) {
        video.videoFile = uploadVideo?.url;
        video.duration = uploadVideo?.duration ?? null;
      }
      await deleteFromCloudinary(oldVideoPath);
    }

    if (req.files?.thumbnail?.[0]) {
      const oldThumbnailPath = video.thumbnail;
      const uploadThumbnail = await uploadOnCloudinary(
        req.files?.thumbnail?.[0]?.path
      );
      if (uploadThumbnail) {
        video.thumbnail = uploadThumbnail?.url;
      }
      await deleteFromCloudinary(oldThumbnailPath);
    }

    if (title !== undefined) {
      video.title = title?.trim();
    }
    if (description !== undefined) {
      video.description = description?.trim();
    }

    await video.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Video updated successfully", video));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "videoId is required !!!");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video doesn't exist");
  }

  const videoDeleted = await Video.findByIdAndDelete(videoId);
  //if there is no video , so no relevancy to store like , comment related to that video
  //like and comment
  await Comment.deleteMany({ video: videoId });
  await Like.deleteMany({ video: videoId });
  //removing the video id if it exists in any playlist
  const playlists = await Playlist.find({ videos: videoId });
  for (const playlist of playlists) {
    await Playlist.findByIdAndUpdate(
      playlist._id,
      {
        $pull: { videos: videoId },
      },
      {
        new: true,
      }
    );
  }

  if (!videoDeleted) {
    throw new ApiError(
      400,
      "Something error happened while deleting the video"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video Deleted Successfully", {}));
});

export {
  getAllVideos,
  publishVideoOnCloudinary,
  publishVideoOnS3,
  getVideoById,
  updateVideoDetails,
  deleteVideo,
};
