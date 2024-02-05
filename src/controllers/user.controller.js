import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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
    if (
      [email, password, fullName, userName].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }
    const isUserExist = await User.findOne({
      $or: [{ email }, { userName }],
    });
    if (isUserExist) {
      throw new ApiError(409, "User already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }
    let coverImageLocalPath;
    if (req?.files && req?.files?.coverImage?.length > 0) {
      coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }
    const userDetails = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      userName: userName.toLowerCase(),
      password,
    });
    const createdUser = await User.findById(userDetails._id).select(
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
    const isPasswordValid = user.isPasswordCorrect(password);
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

export { registerUser, loginUser, logOutUser, refreshAccessToken };