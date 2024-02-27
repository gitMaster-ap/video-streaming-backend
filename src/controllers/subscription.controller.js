import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.query;
    const userId = req.user._id;

    if (!channelId) {
      throw new ApiError(400, "Channel Id is required");
    }
    if (userId.equals(channelId)) {
      throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const isExistingSubscriber = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (isExistingSubscriber) {
      const deleteSubscription = await Subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(200, deleteSubscription, "Unsubscribed successfully")
        );
    }
    const newSubscriber = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newSubscriber, "Subscribed successfully"));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.query;
    if (!subscriberId) {
      return res
        .status(400)
        .json(new ApiError(400, "Subscriber ID is required"));
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriberDetails",
        },
      },
      {
        $project: {
          _id: 0,
          subscriberDetails: {
            _id: 1,
            userName: 1,
            avatar: 1,
          },
        },
      },
    ]);

    const subscriberDetails = subscribers?.flatMap(
      (subscriber) => subscriber?.subscriberDetails
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Subscribers retrieved successfully",
          subscriberDetails
        )
      );
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message)); // Use a centralized error handling middleware
  }
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channelDetails",
        },
      },
      {
        $project: {
          channelDetails: {
            _id: 1,
            userName: 1,
            avatar: 1,
          },
        },
      },
    ]);
    const subscribedChannelsList = subscribedChannels?.flatMap(
      (subscriber) => subscriber?.channelDetails
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Subscribed channels retrieved successfully",
          subscribedChannelsList
        )
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
