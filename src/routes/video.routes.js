import { Router } from "express";
import {
  getAllVideos,
  getVideoById,
  publishVideo,
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
      maxCount: 10,
    },
    {
      name: "thumbnail",
      maxCount: 10,
    },
  ]),
  publishVideo
);

router.route("/getVideoById").get(getVideoById);
router.route("/updateVideoDetails").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 10,
    },
    {
      name: "thumbnail",
      maxCount: 10,
    },
  ]),
  updateVideoDetails
);
// router
//   .route("/:videoId")
//   .get(getVideoById)
//   .delete(deleteVideo)
//   .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
