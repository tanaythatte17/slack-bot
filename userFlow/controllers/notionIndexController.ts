// controller/indexController.ts

import { indexWorkspaceService } from "../service/notionIndexService";

export const triggerIndexing = async (req: any, res: any) => {
  try {
    const workspaceId = req.user.workspaceId;
    const userId = req.user.id;

    indexWorkspaceService(workspaceId, userId).catch((error) => {
      console.error("Background indexing failed:", error);
    });

    res.status(200).json({
      message: "Indexing started",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Indexing failed" });
  }
};