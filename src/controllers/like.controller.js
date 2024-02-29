import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.query;
    const userId = req.user?._id;
    const condition = { likedBy: userId, video: videoId };
    if (!videoId) {
      throw new ApiError(404, "Video not found");
    }
    const like = await Like.findOne(condition);

    if (!like) {
      const newLike = await Like.create({ likedBy: userId, video: videoId });
      res.status(201).json(new ApiResponse(201, "Liked successfully", newLike));
    } else {
      const removeLike = await Like.findOneAndDelete(condition);
      return res
        .status(200)
        .json(new ApiResponse(200, "Removed like successfully", removeLike));
    }
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while liking video"
        )
      );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.query;

    if (!commentId) {
      throw new ApiError(404, "Comment not found");
    }

    const userId = req.user?._id;
    const condition = { likedBy: userId, comment: commentId };
    const like = await Like.findOne(condition);
    const isCommentIdValid = await Comment.findById(commentId);
    if (!isCommentIdValid) {
      throw new ApiError(404, "Comment not found");
    }
    if (!like) {
      const newLike = await Like.create({
        likedBy: userId,
        comment: commentId,
      });
      res.status(201).json(new ApiResponse(201, "Liked successfully", newLike));
    } else {
      const removeLike = await Like.findOneAndDelete(condition);
      return res
        .status(200)
        .json(new ApiResponse(200, "Removed like successfully", removeLike));
    }
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while liking comment"
        )
      );
  }
});

const getVideoLikes = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.query;

    const likes = await Like.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $group: {
          _id: "$likedBy",
          count: { $sum: 1 },
        },
      },
    ]);
    if (!likes?.length) {
      throw new ApiError(404, "No likes for this video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "fetched likes successfully", likes));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching likes"
        )
      );
  }
});

export { toggleVideoLike, toggleCommentLike, getVideoLikes };
