import { Router } from "express";

import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router();
router.use(verifyJWTToken); // Apply verifyJWT middleware to all routes in this file

router.route("/getChannelStats").get(getChannelStats);
router.route("/getChannelVideos").get(getChannelVideos);

export default router;
