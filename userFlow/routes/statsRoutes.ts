import express from "express";
import { protectRoute } from "../middleware/protectRoute";
import { getWorkspaceStats } from "../controllers/statsController";

const router = express.Router();

router.get("/", protectRoute, getWorkspaceStats);

export default router;
