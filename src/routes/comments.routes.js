import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWTToken);
router.route("/addComment").post(addComment);
router.route("/getVideoComments").get(getVideoComments);
router.route("/updateComment").patch(updateComment);
router.route("/deletedComment").delete(deleteComment);

export default router;
