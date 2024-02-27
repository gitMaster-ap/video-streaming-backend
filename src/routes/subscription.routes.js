import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWTToken);

router.route("/toggleSubscription").post(toggleSubscription);
router.route("/getUserChannelSubscribers").get(getUserChannelSubscribers);
router.route("/getSubscribedChannels").get(getSubscribedChannels);
export default router;
