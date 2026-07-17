import { getDocumentsService } from "../service/documentsService";

export const getDocuments = async (req: any, res: any) => {
  try {
    const workspaceId = req.user.workspaceId;
    const documents = await getDocumentsService(workspaceId);
    res.status(200).json({ documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};
