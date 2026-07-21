import crypto from "crypto";
import sseService from "../service/sseService";
import { syncProgressService } from "../service/syncProgressService";

export const subscribeToEvents = async (req: any, res: any) => {
  const userId = req.user.id;
  const workspaceId = req.user.workspaceId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  const clientId = crypto.randomUUID();
  sseService.addClient(userId, clientId, res);

  res.write(
    `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
  );

  if (syncProgressService.isActive(workspaceId)) {
    const documents = syncProgressService.getDocuments(workspaceId);
    for (const document of documents) {
      sseService.sendDocumentUpdate(userId, document);
    }
  }

  req.on("close", () => {
    sseService.removeClient(userId, clientId);
  });
};
