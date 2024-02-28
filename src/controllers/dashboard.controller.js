import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const [stats] = await Video.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalVideos: { $sum: 1 },
        },
      },
    ]);

    const totalVideoViews = stats ? stats.totalViews : 0;

    const totalSubscribers = await Subscription.countDocuments({
      channel: userId,
    });

    const totalLikes = await Like.countDocuments({
      video: { $in: stats ? stats._id : [] },
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalVideoViews,
          totalSubscribers,
          totalVideos: stats ? stats.totalVideos : 0,
          totalLikes,
        },
        "fetched channel stats successfully"
      )
    );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const channelVideo = await Video.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
        },
      },
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, "fetched videos successfully", channelVideo));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { getChannelStats, getChannelVideos };
