import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideoOnCloudinary,
  updateVideoDetails,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWTToken); // Apply verifyJWT middleware to all routes in this file

router.route("/getAllVideos").get(getAllVideos);
router.route("/publishVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideoOnCloudinary
);

router.route("/getVideoById").get(getVideoById);
router.route("/updateVideoDetails").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateVideoDetails
);
router.route("/deleteVideo").delete(deleteVideo);

export default router;
