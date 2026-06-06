import { getWorkspaceStatsService } from "../service/statsService";

export const getWorkspaceStats = async (req: any, res: any) => {
  try {
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace not found in session" });
    }

    const stats = await getWorkspaceStatsService(workspaceId);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching workspace stats:", error);
    res.status(500).json({ error: "Failed to fetch workspace stats" });
  }
};
