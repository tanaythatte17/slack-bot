# slackbotfyi Frontend

React + Vite dashboard that talks to the **userFlow** API (`http://localhost:3000` by default).

## Prerequisites

1. **PostgreSQL** running with the userFlow schema migrated
2. **userFlow** API running on port 3000
3. Slack & Notion OAuth apps configured in `userFlow/.env`

## Environment

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Backend (`userFlow/.env`) — required for auth cookies & redirects

Set `FRONTEND_URL` to your Vite dev server (not `https://slack.com`):

```env
FRONTEND_URL=http://localhost:5173
```

OAuth redirect URIs must point at the **backend**, not the frontend:

```env
SLACK_REDIRECT_URI=http://localhost:3000/auth/slack/callback
NOTION_REDIRECT_URI=http://localhost:3000/auth/notion/callback
```

## Run locally

```bash
# Terminal 1 — API
cd userFlow
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API endpoints used

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/auth/slack/auth-url` | No | — | `{ authUrl: string }` |
| GET | `/auth/slack/callback` | No | Query: `code` | Sets `jwt` cookie, redirects to frontend |
| GET | `/auth/me` | Cookie or `Bearer` | — | `{ userId, workspaceId, workspaceName, notionConnected }` |
| GET | `/auth/notion/auth-url` | Yes | — | `{ authUrl: string }` |
| GET | `/auth/notion/callback` | No | Query: `code`, `state` | Redirects to frontend |
| POST | `/notion/index` | Yes | — | `{ message: "Indexing started" }` |

Protected routes accept either:

- HttpOnly cookie `jwt` (used by the frontend with `credentials: 'include'`), or
- Header `Authorization: Bearer <token>`

## User flow

1. **Sign in** — `/auth` → “Continue with Slack” → Slack OAuth → backend sets JWT cookie → redirect to `/dashboard`
2. **Connect Notion** — Dashboard → “Connect” on Notion card → Notion OAuth → redirect back to `/dashboard`
3. **Index documents** — “Sync Now” → `POST /notion/index` (fire-and-forget indexing on the server)

Session is restored on page load via `GET /auth/me`.

## Project layout

- `src/lib/api.ts` — fetch wrapper and endpoint helpers
- `src/context/AuthContext.tsx` — session state and OAuth starters
- `src/app/components/AuthPage.tsx` — Slack sign-in
- `src/app/components/Dashboard.tsx` — Notion connect + indexing
