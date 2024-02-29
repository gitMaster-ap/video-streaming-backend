import { Router } from "express";
import {
  getVideoLikes,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWTToken);
router.route("/toggleVideoLike").post(toggleVideoLike);
router.route("/toggleCommentLike").post(toggleCommentLike);
router.route("/getVideoLikes").get(getVideoLikes);

export default router;
