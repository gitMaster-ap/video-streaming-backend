import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));
app.use(express.static("/public/tmp"));
app.use(cookieParser());

// routes import
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";

// routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);

export default app;
