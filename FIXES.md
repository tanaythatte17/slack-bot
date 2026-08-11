# Pre-Open-Source Fixes

Checklist of what to fix before making this repo public. Grouped by priority.

## 🔴 Critical — bugs & security (fix first)

- [ ] **`serverFlow/src/rag/search.ts:235`** — `scoreThreshold` is referenced but never defined anywhere in the file. This throws a `ReferenceError` at runtime, meaning the vector-relevance filter path is currently broken.
- [ ] **`userFlow/middleware/protectRoute.ts:35-48`** — workspace-membership authorization check is commented out. Any authenticated user can currently access any workspace's routes/data. Implement it or remove the dead block.
- [ ] **Plaintext OAuth tokens in DB** — `slack_bot_token`, `notion_token`, `notion_refresh_token` in `userFlow/prisma/schema.prisma` are stored unencrypted. Encrypt at rest (e.g. `pgcrypto` or app-level encryption with a KMS-managed key).
- [ ] **Sensitive data logged to console**:
  - `userFlow/service/authService.ts:43` logs the full Slack user object.
  - `userFlow/service/authService.ts:142` logs the full Notion OAuth token response.
  - Remove or redact before logging; tokens/PII should never hit stdout/log aggregators.
- [ ] **`docker-compose.yml`** references `./userflow/.env` and `./serverflow/.env` (lowercase) but the actual directories are `userFlow/` and `serverFlow/` (capital F). Verify this against the real deploy layout — on a case-sensitive filesystem this silently fails to load env vars.
- [ ] **Remove the `"crypto": "^1.0.1"` npm dependency** in `userFlow/package.json`. It's a deprecated placeholder package that shadows Node's built-in `crypto` module, which the code already uses via `import crypto from "crypto"`.

## 🟠 Repo structure & first impressions

- [ ] Add a root **`README.md`**: what the project does, the userFlow/serverFlow/frontend split, architecture diagram, setup & run instructions.
- [ ] Add a **`LICENSE`** file.
- [ ] Add **`.env.example`** to `userFlow/`, `serverFlow/`, and `frontend/` listing required env vars (no real values).
- [ ] Fix inconsistent project naming:
  - `serverFlow/package.json` → `"name": "slackbotfyi"`
  - `userFlow/package.json` → `"name": "userflow"`
  - `frontend/package.json` → `"name": "@figma/my-make-file"` (Figma Make scaffold leftover)
  - Pick one consistent product name and apply it across all three.
- [ ] Remove/replace Figma Make scaffolding left in `frontend/`:
  - `frontend/ATTRIBUTIONS.md`
  - `frontend/guidelines/Guidelines.md` (still contains the unfilled template placeholder text)
- [ ] Rename `userFlow` / `serverFlow` to something that reflects what they actually are (`userFlow` = API + auth + Notion indexing backend, `serverFlow` = the actual Slack bot/RAG service) or document the split clearly in the README.
- [ ] Delete `userFlow/src/` — empty, tracked, unused directory.
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
