// routes/indexRoutes.ts

import express from "express";
import { protectRoute } from "../middleware/protectRoute";
import { triggerIndexing } from "../controllers/notionIndexController";

const router = express.Router();

router.post("/index", protectRoute, triggerIndexing);

export default router;