import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, videoId } = req.query;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(404, "Video not found");
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, "Comments fetched successfully", comments));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching comments"
        )
      );
  }
});

const addComment = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.query;
    const { content } = req.body;
    const userId = req.user_id;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(404, "Video not found");
    }

    if (!content?.trim()) {
      throw new ApiError(400, "Please provide content");
    }

    const comment = await Comment.create({
      content: content.trim(),
      video: videoId,
      owner: userId,
    });

    res.status(201).json(new ApiResponse(201, "Comment created", comment));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while creating comment"
        )
      );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.query;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Please provide content");
  }
  if (!commentId) {
    throw new ApiError(404, "Please provide comment id");
  }
  const updatedComment = await Comment.updateOne(
    {
      _id: commentId,
    },
    {
      content: content,
    }
  );
  if (!updatedComment?.modifiedCount === 1) {
    throw new ApiError(404, "Comment not found");
  }

  res.status(200).json(new ApiResponse(200, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.query;

    if (!commentId) {
      throw new ApiError(404, "Please provide comment id");
    }

    const deletedComment = await Comment.deleteOne({
      _id: commentId,
    });
    if (!deletedComment?.deletedCount) {
      throw new ApiError(404, "Comment not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Comment deleted", deletedComment));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while deleting comment"
        )
      );
  }
});
export { getVideoComments, addComment, updateComment, deleteComment };
