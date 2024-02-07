import { Router } from "express";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  logOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//  secured routes
router.route("/logout").post(verifyJWTToken, logOutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWTToken, changeCurrentUserPassword);
router.route("/getCurrentUser").get(verifyJWTToken, getCurrentUser);
router
  .route("/updateAccountDetails")
  .patch(verifyJWTToken, updateAccountDetails);
router
  .route("/updateAvatar")
  .patch(verifyJWTToken, upload.single("avatar"), updateUserAvatar);
router
  .route("/getUserChannelProfile/:userName")
  .get(verifyJWTToken, getUserChannelProfile);
router.route("/getUserWatchHistory").get(verifyJWTToken, getUserWatchHistory);
export default router;
