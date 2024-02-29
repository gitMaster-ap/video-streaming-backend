import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title?.trim() || !description?.trim()) {
      throw new ApiError(400, "Please provide both title and description");
    }

    const newPlaylist = await Playlist.create({
      name: title.trim(),
      description: description.trim(),
      videos: [],
      owner: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, "Playlist created", newPlaylist));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while creating playlist"
        )
      );
  }
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const userPlaylist = await Playlist.find({ owner: userId });
    if (!userPlaylist) {
      throw new ApiError(404, "Playlist not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "fetched playlist successfully", userPlaylist)
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching playlist"
        )
      );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.query;

  const playlist = await Playlist.findById(playlistId);

  res
    .status(200)
    .json(new ApiResponse(200, "fetched playlist successfully", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.query;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
    const isVideoExist = playlist?.videos?.find(
      (video) => video?.toString() === videoId
    );
    if (isVideoExist) {
      throw new ApiError(400, "Video already in playlist");
    }
    const updatedPlaylist = await Playlist.updateOne(
      { _id: playlistId },
      {
        $push: {
          videos: videoId,
        },
      }
    );
    if (!updatedPlaylist.modifiedCount) {
      throw new ApiError(500, "Something went wrong while updating playlist");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Video added to playlist successfully"));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while adding video to playlist"
        )
      );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.query;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "playlistId and videoId are required");
  }

  const result = await Playlist.updateOne(
    { _id: playlistId },
    { $pull: { videos: new mongoose.Types.ObjectId(videoId) } }
  );

  if (result.nModified === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Video removed from playlist successfully"));
});
const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.query;

    if (!playlistId) {
      throw new ApiError(400, "playlistId is required");
    }

    const result = await Playlist.deleteOne({ _id: playlistId });

    if (result.deletedCount === 0) {
      throw new ApiError(404, "Playlist not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Playlist deleted successfully", result));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while deleting playlist"
        )
      );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.query;
    const { name, description } = req.body;

    if (!playlistId) {
      throw new ApiError(400, "playlistId is required");
    }

    if (!name?.trim() || !description?.trim()) {
      throw new ApiError(400, "Please provide both name and description");
    }

    const updateResult = await Playlist.updateOne(
      { _id: playlistId },
      {
        name: name.trim(),
        description: description.trim(),
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new ApiError(404, "Playlist not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "Playlist updated successfully", updateResult)
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode, error.message || error));
  }
});
export {
  createPlaylist,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
