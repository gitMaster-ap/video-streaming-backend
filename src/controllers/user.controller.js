import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    //  update refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, fullName, userName } = req.body;
    const { avatar, coverImage } = req.files || {};
    
    if (
      [email, password, fullName, userName].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const isUserExist = await User.findOne({ $or: [{ email }, { userName }] });
    if (isUserExist) {
      throw new ApiError(409, "User already exists");
    }

    const [avatarLocalPath, coverImageLocalPath] = await Promise.all([
      uploadOnCloudinary(avatar?.[0]?.path),
      uploadOnCloudinary(coverImage?.[0]?.path),
    ]);

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const userDetails = await User.create({
      fullName,
      avatar: avatarLocalPath.url,
      coverImage: coverImageLocalPath?.url || "",
      email,
      userName: userName.toLowerCase(),
      password,
    });

    const createdUser = await User.findById(
      userDetails._id,
      "-password -refreshToken -__v  -_id "
    );

    if (!createdUser) {
      throw new ApiError(404, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "User registered successfully", createdUser));
  } catch (error) {
    // Handle the error here
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode, error.message));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    if (!(userName || email)) {
      throw new ApiError(400, "Username or email is required");
    }
    const user = await User.findOne({ $or: [{ email }, { userName }] });
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password.trim());
    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid password");
    }
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    const loggedInUser = {
      fullName: user.fullName,
      email: user.email,
      userName: user.userName,
      avatar: user.avatar,
      coverImage: user.coverImage,
      watchHistory: user.watchHistory,
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "User logged in successfully", {
          user: loggedInUser,
        })
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode, error.message));
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(
      _id,
      {
        $set: { refreshToken: undefined },
      },
      { new: true }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while logging out user");
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    // generate new refresh and accessTokens
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while refreshing access token"
    );
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(_id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(400, "Old password is incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    res
      .status(error.statusCode)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while changing password"
        )
      );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email || fullName.trim() === "" || email.trim() === "") {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.updateOne(
    { _id: req.user?._id },
    {
      $set: {
        fullName,
        email,
      },
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;
    console.log(req.files);

    const avatarLocalPath = req.files?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }
    const previousAvatar = req.user.avatar;
    // delete previous avatar from cloudinary
    await deleteFromCloudinary(previousAvatar);
    const user = await User.updateOne(
      _id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated successfully"));
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while updating avatar"
        )
      );
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { userName } = req.params;

    if (!userName?.trim()) {
      throw new ApiError(400, "User name is missing");
    }
    const channel = await User.aggregate([
      {
        $match: {
          userName: userName?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          subscribedToCount: { $size: "$subscribedTo" },
          isSubscribed: {
            $cond: {
              if: {
                $in: [
                  true,
                  {
                    $map: {
                      input: "$subscribers",
                      as: "sub",
                      in: { $eq: ["$$sub.subscriber", req.user?._id] },
                    },
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          userName: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
          subscribersCount: 1,
          subscribedToCount: 1,
          isSubscribed: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "User channel  fetched successfully")
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching user channel"
        )
      );
  }
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: "video",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      userName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history Fetched successfully"
        )
      );
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json(
        new ApiError(
          error.statusCode || 500,
          error.message || "Something went wrong while fetching watch history"
        )
      );
  }
});
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getUserWatchHistory,
};
