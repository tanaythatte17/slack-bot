import express from "express";
import {getSlackAuthUrl, handleSlackCallback, getNotionAuthUrl, handleNotionCallback, getSession, getSlackBotUrl, handleSlackBotCallback } from "../controllers/authController";
import {protectRoute} from "../middleware/protectRoute";

const router = express.Router();

router.get("/slack/auth-url", getSlackAuthUrl);
router.get("/slack/callback", handleSlackCallback);
router.get("/me", protectRoute, getSession);
router.get("/notion/auth-url", protectRoute, getNotionAuthUrl);
router.get("/notion/callback", handleNotionCallback);
router.get("/slack/bot/auth-url", protectRoute, getSlackBotUrl);
router.get("/slack/bot/callback", handleSlackBotCallback);

export default router;