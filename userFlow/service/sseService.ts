import type { Response } from "express";

type SSEClient = {
  id: string;
  response: Response;
  userId: string;
};

export type DocumentSyncUpdate = {
  pageId: string;
  name: string;
  status: "in_progress" | "completed" | "failed";
};

class SSEService {
  private clients = new Map<string, Set<SSEClient>>();

  addClient(userId: string, clientId: string, response: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }

    const client: SSEClient = { id: clientId, response, userId };
    this.clients.get(userId)!.add(client);
    return client;
  }

  removeClient(userId: string, clientId: string) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    for (const client of userClients) {
      if (client.id === clientId) {
        userClients.delete(client);
        break;
      }
    }

    if (userClients.size === 0) {
      this.clients.delete(userId);
    }
  }

  sendToUser(userId: string, data: object) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const deadClients = new Set<SSEClient>();

    for (const client of userClients) {
      try {
        client.response.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        deadClients.add(client);
      }
    }

    for (const deadClient of deadClients) {
      userClients.delete(deadClient);
    }

    if (userClients.size === 0) {
      this.clients.delete(userId);
    }
  }

  sendDocumentUpdate(userId: string, document: DocumentSyncUpdate) {
    this.sendToUser(userId, {
      type: "document",
      action: "updated",
      data: document,
      timestamp: new Date().toISOString(),
    });
  }

  sendSyncStatus(
    userId: string,
    status: "started" | "completed" | "error",
    message: string,
    details: Record<string, unknown> = {}
  ) {
    this.sendToUser(userId, {
      type: "syncStatus",
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

export default new SSEService();
