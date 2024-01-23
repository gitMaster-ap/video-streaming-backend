import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

export { registerUser };
