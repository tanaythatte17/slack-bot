import type { DocumentSyncUpdate } from "./sseService";

type WorkspaceSyncState = {
  jobId: string;
  documents: Map<string, DocumentSyncUpdate>;
};

const activeSyncs = new Map<string, WorkspaceSyncState>();

export const syncProgressService = {
  start(workspaceId: string, jobId: string) {
    activeSyncs.set(workspaceId, { jobId, documents: new Map() });
  },

  updateDocument(workspaceId: string, document: DocumentSyncUpdate) {
    const state = activeSyncs.get(workspaceId);
    if (!state) return;
    state.documents.set(document.pageId, document);
  },

  getDocuments(workspaceId: string): DocumentSyncUpdate[] {
    const state = activeSyncs.get(workspaceId);
    if (!state) return [];
    return Array.from(state.documents.values());
  },

  isActive(workspaceId: string) {
    return activeSyncs.has(workspaceId);
  },

  clear(workspaceId: string) {
    activeSyncs.delete(workspaceId);
  },
};
