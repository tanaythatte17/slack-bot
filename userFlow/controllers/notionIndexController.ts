// controller/indexController.ts

import { indexWorkspaceService } from "../service/notionIndexService";

export const triggerIndexing = async (req: any, res: any) => {
  try {
    const workspaceId = req.user.workspaceId;

    // Fire-and-forget (don’t block request)
    indexWorkspaceService(workspaceId);

    res.status(200).json({
      message: "Indexing started",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Indexing failed" });
  }
};