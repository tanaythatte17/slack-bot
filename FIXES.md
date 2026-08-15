# Pre-Open-Source Fixes

Checklist of what to fix before making this repo public. Grouped by priority.

## 🔴 Critical — bugs & security (fix first) — ✅ done

- [x] **`serverFlow/src/rag/search.ts:235`** — `scoreThreshold` was referenced but never defined. Fixed: it now filters against the already-defined `MIN_SIMILARITY_FLOOR` constant, which is clearly what was intended.
- [x] **`userFlow/middleware/protectRoute.ts`** — workspace-membership authorization check was commented out. Re-enabled: requests carrying a `workspaceId` in the JWT now get a real `workspaceMember.findUnique` check and a `403` on no membership.
- [x] **Plaintext OAuth tokens in DB** — `slack_bot_token`, `notion_token`, `notion_refresh_token` are now encrypted at rest with AES-256-GCM (Node's built-in `crypto`, no new dependency):
  - `userFlow/utils/crypto.ts` (`encryptToken`/`decryptToken`) and `serverFlow/src/lib/crypto.ts` (`decryptToken` only — serverFlow never writes tokens).
  - Encrypted on write in `userFlow/service/authService.ts` (Notion token exchange, Slack bot install exchange).
  - Decrypted on read in `userFlow/service/notionIndexService.ts` (before calling the Notion API) and `serverFlow/src/app.ts` (Bolt `authorize` callback).
  - `userFlow/controllers/authController.ts`'s `getSession` only checks token presence/length, not the actual value, so it was left untouched — ciphertext is equally valid for a truthiness check.
  - **Requires a new env var**: `TOKEN_ENCRYPTION_KEY`, a base64-encoded 32-byte key, set identically in both `userFlow/.env` and `serverFlow/.env` (both services need it — userFlow to encrypt/decrypt, serverFlow to decrypt). Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
  - **Operational note**: any tokens already stored in plaintext in an existing dev database will fail to decrypt after this change (they're not in the IV+authTag+ciphertext format). There's no silent-fallback path by design — reconnect Slack/Notion for any existing workspaces after deploying this.
- [x] **Sensitive data logged to console** — removed the `console.log("Authenticated user:", user)` and `console.log("Notion OAuth response:", notionData)` lines from `authService.ts`.
- [x] **`docker-compose.yml`** case mismatch — fixed `./userflow/.env` → `./userFlow/.env` and `./serverflow/.env` → `./serverFlow/.env`.
- [x] **Removed the `"crypto": "^1.0.1"` npm dependency** from `userFlow/package.json` via `npm uninstall crypto` (lockfile updated too). Note: this package could never actually have shadowed the built-in — Node always resolves core modules before `node_modules` — so this was a pure cleanliness fix, not a behavior change.

## 🟠 Repo structure & first impressions

- [x] Add a root **`README.md`**: what the project does, the userFlow/serverFlow/frontend split, architecture diagram (mermaid), setup & run instructions.
- [x] Add a **`LICENSE`** file (MIT).
- [x] Add **`.env.example`** to `userFlow/`, `serverFlow/`, and `frontend/` — each lists exactly the env vars that service's code actually reads (verified via `process.env.*`/`import.meta.env.*` grep), with comments, no real values.
- [x] Fix inconsistent project naming — settled on **`slackbotfyi`** as the product name (it was already used in `frontend/README.md` and `serverFlow`'s old package name):
  - `serverFlow/package.json` → `"slackbotfyi-serverflow"`
  - `userFlow/package.json` → `"slackbotfyi-userflow"`
  - `frontend/package.json` → `"slackbotfyi-frontend"` (was `"@figma/my-make-file"`)
  - `frontend/index.html` `<title>` → `slackbotfyi` (was `"SaaS Landing Page and Dashboard"`, a leftover Figma Make default)
- [x] Removed Figma Make scaffolding: `frontend/guidelines/Guidelines.md` (empty unfilled template) deleted. `frontend/ATTRIBUTIONS.md` was **kept** — it's a legitimate MIT/Unsplash attribution notice, not scaffolding.
- [ ] Rename `userFlow` / `serverFlow` folders themselves to something that reflects what they actually are, or document the split clearly in the README — **partially done**: the README now documents the split clearly; the folder names were left as-is to avoid churn (would require updating every import path, the Dockerfiles, and CI workflow for a purely cosmetic gain).
- [x] Delete `userFlow/src/` — empty, tracked, unused directory.
- [ ] Consider a root `package.json` / workspace config (pnpm/turborepo) to tie the three apps together as one product instead of three unrelated-looking folders.
- [ ] Add at least minimal tests, especially around the RAG search/chunking logic — currently there are zero tests anywhere in the repo.

## 🟡 `serverFlow` internal structure (see detailed notes below)

- [x] Extract Slack event listeners out of `app.ts` into their own module(s). → `src/listeners/appMention.ts`, `src/listeners/directMessage.ts`.
- [x] Create a single shared DB pool module instead of two independent `new Pool()` instances. → `src/config/db.ts`, imported by both `app.ts`'s `authorize` callback and `rag/search.ts`.
- [x] Centralize `dotenv.config()` into one entrypoint instead of calling it in three separate files. → `src/config/env.ts`, imported first in `app.ts` (and defensively in `config/db.ts`).
- [x] Delete or wire up `serverFlow/lib/chunker.ts` — `chunkText()` was dead code, never imported anywhere. Deleted; chunking logic still only lives in `userFlow/utils/notionUtils.ts`, unshared (fine for now — flag if `serverFlow` ever needs its own chunking).

## 🟢 Code quality polish

- [ ] Replace `req: any, res: any` in controllers/middleware with real Express types (`Request`, `Response`) — undermines `"strict": true` in `tsconfig.json`.
- [ ] Add a real logger (pino/winston) instead of scattered `console.log`/`console.error`, and strip leftover debug logs (e.g. `console.log("Prompt is : ", prompt)` in `rag/answer.ts`, `console.log("Post-rerank scores:", ...)` in `rag/search.ts`).
- [ ] Add ESLint + Prettier configs shared across `userFlow`/`serverFlow`/`frontend` — current formatting/import style is inconsistent (missing semicolons, mixed conventions).
- [ ] Fix duplicate `// 5.` step-numbering comments in `serverFlow/rag/search.ts`.
- [ ] Add a lint/typecheck/test step to `.github/workflows/docker.yml` (or a separate CI workflow) so broken code (like the `scoreThreshold` bug) can't merge to `main` unnoticed.

---

## Detailed note: `serverFlow` internal structure — ✅ done

Compared to `userFlow`, which has a clean layered layout (`routes/ → controllers/ → service/`, plus `middleware/`, `lib/`, `utils/`), `serverFlow` used to be essentially flat:

```
serverFlow/
  app.ts          # Slack App init + DB pool + BOTH event listeners + business logic, all inline (127 lines)
  lib/
    chunker.ts    # unused — chunkText() is never imported anywhere
  rag/
    answer.ts     # LLM orchestration (creates its OWN Pool via search.ts, own dotenv.config())
    embed.ts      # embedding calls (own dotenv.config())
    search.ts     # retrieval logic (creates its OWN Pool, separate from app.ts's Pool)
```

Problems this caused: `app.ts` did too much (Postgres pool + Slack `authorize` callback + both event handlers' business logic in one 127-line file); two independent `Pool` instances that never shared a connection pool; `dotenv.config()` called three times instead of once at the entrypoint; `lib/chunker.ts` was dead code; and there was no home for Slack-specific listener code.

**This has been restructured** into:

```
serverFlow/
  src/
    config/
      env.ts        # single dotenv.config() call, imported first by app.ts
      db.ts         # single shared `pool` export, used by search.ts and app.ts's authorize callback
    listeners/
      appMention.ts # app_mention event handler (moved out of app.ts)
      directMessage.ts  # DM event handler (moved out of app.ts)
    rag/
      embed.ts
      search.ts
      answer.ts
    app.ts          # thin: builds the Bolt App, registers listeners, calls app.start()
  Dockerfile
  package.json
  tsconfig.json
```

`lib/chunker.ts` was deleted (confirmed unused via repo-wide grep before removal). Verified with `npm run build` (tsup) after the move — builds clean to `dist/app.js`, same as before.

This mirrors the `routes/controllers/service` layering already used in `userFlow`, so the two backend services now read as one coherent codebase instead of two differently-organized projects glued together by Docker Compose.

### Found while restructuring (not fixed yet — separate from this pass)

Running `npx tsc --noEmit` in `serverFlow` (not part of any existing script — the repo has never actually typechecked this package) surfaces pre-existing gaps, unrelated to the restructuring itself:

- `tsconfig.json` doesn't set `allowImportingTsExtensions`, so every `./file.ts`-style import (a pattern already used throughout this codebase, needed for `tsx`/`tsup`) fails strict `tsc`. Builds still work because `tsup`/`tsx` are esbuild-based and don't enforce this.
- `src/listeners/directMessage.ts` — `message.team` doesn't exist on every member of Slack Bolt's `GenericMessageEvent` union (e.g. `ChannelPostingPermissionsMessageEvent`), so `strict` typechecking fails there.
- The `scoreThreshold` bug in `src/rag/search.ts:235` (see top of this file) also only shows up under `tsc`, not under `tsup`'s build.

None of these are regressions from the restructuring — they existed identically before, just never surfaced because nothing in this repo runs `tsc --noEmit`. Worth adding a `typecheck` script + CI step so these don't slip through again.
