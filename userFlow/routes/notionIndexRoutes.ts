import express from "express";
import { protectRoute } from "../middleware/protectRoute";
import { triggerIndexing } from "../controllers/notionIndexController";
import { subscribeToEvents } from "../controllers/sseController";
import { getDocuments } from "../controllers/documentsController";

const router = express.Router();

router.post("/index", protectRoute, triggerIndexing);
router.get("/events", protectRoute, subscribeToEvents);
router.get("/documents", protectRoute, getDocuments);

export default router;