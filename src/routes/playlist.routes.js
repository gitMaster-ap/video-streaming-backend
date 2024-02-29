import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWTToken);
router.route("/createPlaylist").post(createPlaylist);
router.route("/getUserPlaylist").get(getUserPlaylist);
router.route("/getPlaylistById").get(getPlaylistById);
router.route("/addVideoToPlaylist").post(addVideoToPlaylist);
router.route("/removeVideoFromPlaylist").delete(removeVideoFromPlaylist);
router.route("/deletePlaylist").delete(deletePlaylist);
router.route("/updatePlaylist").patch(updatePlaylist);

export default router;
