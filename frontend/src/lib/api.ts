const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export type Session = {
  userId: string;
  workspaceId: string;
  workspaceName: string | null;
  notionConnected: boolean;
  slackConnected: boolean;
};

export type AuthUrlResponse = {
  authUrl: string;
};

export type IndexResponse = {
  message: string;
};

export type WorkspaceStats = {
  indexedDocuments: number;
  totalChunks: number;
};

export const api = {
  getSlackAuthUrl: () => request<AuthUrlResponse>('/auth/slack/auth-url'),
  getSlackBotAuthUrl: () => request<AuthUrlResponse>('/auth/slack/bot/auth-url'),
  getSession: () => request<Session>('/auth/me'),
  getNotionAuthUrl: () => request<AuthUrlResponse>('/auth/notion/auth-url'),
  triggerNotionIndex: () =>
    request<IndexResponse>('/notion/index', { method: 'POST' }),
  getWorkspaceStats: () => request<WorkspaceStats>('/stats'),
};
