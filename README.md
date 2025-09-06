# Bookmarks App – Gemini CLI Testbed

This repo is a **sandbox** for testing Gemini CLI planning modes:
**Stock**, **Custom**, **Sequential Thinking**, etc.

Each test runs in its own **git branch**, with its own **Postgres DB** and **Redis DB index**, ensuring clean isolation.

---

## 1. Prerequisites

- **Node.js** 22 LTS
- **pnpm** → `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** → required for Postgres + Redis
- **OpenSSL** → for generating secrets

---

## 2. Initial Setup

### 2.1 Scaffold Next.js app

```bash
npx create-next-app@latest bookmarks-app
cd bookmarks-app
```

### 2.2 Initialize Git

```bash
git init
git add .
git commit -m "chore: scaffold"
```

### 2.3 Install Dependencies

```bash
# Prisma ORM + client
pnpm add -D prisma
pnpm add @prisma/client

# Playwright for E2E tests
pnpm add -D playwright @types/node
npx playwright install --with-deps
```

---

## 3. Environment Setup

### 3.1 Start Postgres + Redis

```bash
# Postgres
docker run -d \
  --name pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16

# Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7
```

### 3.2 Generate Secrets

```bash
openssl rand -hex 32
```

### 3.3 Create `.env.local`

```bash
touch .env.local
```

Example `.env.local` (for stock test run):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookmarks_stock
REDIS_URL=redis://localhost:6379/0
CACHE_ENABLED=true

NEXTAUTH_SECRET=<replace-with-openssl-output>
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=<replace-with-openssl-output>
JWT_SECRET=<replace-with-openssl-output>
```

For each test, use a **unique DB name** and **Redis DB index**:
- `bookmarks_stock` → Redis DB `0`
- `bookmarks_custom` → Redis DB `1`
- `bookmarks_st` → Redis DB `2`

### 3.4 Create Database

```bash
docker exec -it pg psql -U postgres -c "CREATE DATABASE bookmarks_stock;"
```

---

## 4. Branches Per Test

Each Gemini CLI test runs on a dedicated branch:

```bash
# Stock planning test
git checkout -b test-stock
# DB: bookmarks_stock, Redis DB: 0

# Custom plan test
git checkout -b test-custom main
# DB: bookmarks_custom, Redis DB: 1

# Sequential thinking test
git checkout -b test-st main
# DB: bookmarks_st, Redis DB: 2
```

---

## 5. Prisma Workflow

### Commands Overview
- **`pnpm prisma migrate dev`** →
  Generates migrations **+ applies them** to DB **+ updates Prisma Client**.
  *(Preferred for production and proper schema versioning).*

- **`pnpm prisma db push`** →
  Pushes schema directly to DB **without creating migrations**.
  *(OK for quick prototypes, but migrations won’t be tracked).*

### For Gemini CLI Tests
> **Do not** run Prisma commands manually.
Provide the `.env.local` + empty DB, and **let Gemini CLI decide** whether to:
- Create `schema.prisma`
- Run `migrate dev` *(preferred)*
- Or use `db push` *(if quicker)*

---

## 6. Running the App

```bash
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 7. Running Tests

### Install Playwright Browsers

```bash
npx playwright install --with-deps
```

### Run Tests

```bash
pnpm test
pnpm e2e
```

---

## 8. Resetting Environment

### Recommended (Option A):
**One DB + Redis DB index per branch** → **no reset required**.

### If you want to reset in-place:

```bash
# Reset Prisma DB schema + data
pnpm prisma migrate reset --force --skip-generate --skip-seed

# Clear Redis cache for current test DB index
redis-cli -u redis://localhost:6379/0 FLUSHDB
```

### Reset Docker Containers (hard reset):

```bash
docker stop pg redis && docker rm pg redis
docker volume prune -f
```

---

## 9. Evaluation Workflow

For each Gemini CLI test run:

1. Checkout branch (`test-stock`, `test-custom`, `test-st`, …).
2. Create DB (`bookmarks_stock`, `bookmarks_custom`, `bookmarks_st`, …).
3. Set `.env.local` for that branch.
4. Start **Gemini CLI**:
   ```bash
   gemini
   ```
5. Provide the same evaluation prompt:
   ```
   Implement “Rate-Limited Bookmarks”:
   - Scaffold Prisma schema for User + Bookmark
   - Generate migrations
   - Implement POST /api/bookmarks, GET /api/bookmarks, GET /api/bookmarks/top
   - Add Redis caching + invalidation
   - Implement per-user rate-limiting
   - Add Playwright E2E tests
   - Use env vars; never hardcode secrets
   - Show diffs + commands after each step
   ```
6. Let Gemini CLI handle migrations, API routes, caching, and tests.
7. Compare results across branches via:
   ```bash
git diff main
```

---

## 10. Notes

- Keep `.env.local` **out of Git**.
- Each planner’s migrations, schema, and code live in its own branch.
- Divergence between `prisma/schema.prisma` and `prisma/migrations/` is expected.
- Use `git diff` and DB schema comparison to evaluate planning quality.

---

## 11. What to Evaluate After Each Run (Success & Quality)

After you kick off Gemini CLI and the run finishes (or pauses for approval), verify success with these checks. Treat them as a pass/fail + quality scoring rubric so you can compare branches (stock vs custom vs sequential-thinking).

### 11.1 Quick Functional Checks (must pass)
- **Boots:** `pnpm dev` → visit http://localhost:3000 without errors.
- **Create:** Add a bookmark via the UI form → it appears in the list.
- **Rate limit:** Create >5 bookmarks in ≤60s → receive 429 in API/UI; future attempts respect `Retry-After`.
- **Top list cache:** Hit `GET /api/bookmarks/top` twice in <60s → first call misses cache, second call hits cache.
  - CLI check:
    ```bash
    curl -i http://localhost:3000/api/bookmarks/top
    curl -i http://localhost:3000/api/bookmarks/top
    ```
- **Invalidation:** After creating a new bookmark, the `/top` endpoint reflects updated results within the TTL or after cache bust.
- **Auth guard:** Unauthenticated POST to `/api/bookmarks` returns 401.

### 11.2 Tests (must pass)
- **Unit tests:** `pnpm test` (rate limiter core, cache invalidation, input validation).
- **E2E tests:** `pnpm e2e` (Playwright).
  - Should cover login → create → list; and the 429 path.

### 11.3 Schema & Migrations (consistency)
- Prisma files exist and make sense:
  - `prisma/schema.prisma`
  - `prisma/migrations/*` (if migrate flow used)
- DB actually contains the tables:
  ```bash
  pnpm prisma studio
  # or psql:
  docker exec -it pg psql -U postgres -d <your_db> -c '\dt'
  ```

### 11.4 Logging & Observability (basic)
- Server logs include request id, user id (when authenticated), operation, latency.
- Rate-limit 429s are clearly logged.

### 11.5 Code Quality (subjective but important)
Score each item 1–5:
- **Plan quality**: clear ≤7 steps; risks called out; “Done means” checklist present.
- **Grounding**: cited official docs before using unfamiliar APIs (via `fetch`).
- **Diff hygiene**: small, reversible commits; minimal unrelated edits.
- **Architecture**: DB models map cleanly to feature; rate limiter design reasonable.
- **Tests**: meaningful assertions; selectors stable (role/name); minimal flakes.
- **Security**: secrets only via env; 401 for unauth; input validation present.
- **Docs**: README/CHANGELOG/DECISIONS updated with what changed and why.

> Tip: Keep a simple score sheet per branch (sum of 7×(1–5)). Higher is better.

### 11.6 Useful one-liners
```bash
# Show 429 quickly (assuming auth handled by your app)
autocannon -d 10 -c 5 -p 0 http://localhost:3000/api/bookmarks -m POST -b '{"url":"https://example.com"}' -H content-type:application/json

# Confirm Redis keys changing (optional)
redis-cli -u "$REDIS_URL" KEYS "*"

# Confirm rate-limit headers
curl -i -X POST http://localhost:3000/api/bookmarks -H "content-type:application/json" -d '{"url":"https://example.com"}'
```

---

## 12. Prompt to test

```markdown
=== GOAL ===
Build a working “Rate-Limited Bookmarks” feature in this Next.js app with:
- Postgres persistence (Prisma)
- Redis caching for “top bookmarks” with invalidation
- Per-user rate limiting on bookmark creation
- Minimal Next.js UI to create and list bookmarks
- Unit tests (Vitest) + E2E tests (Playwright)
- Short docs updates (README/CHANGELOG/DECISIONS)

Use environment variables from `.env.local`. Do not hardcode secrets. Assume Postgres/Redis are running and the database for this branch already exists.

SAFETY & INFRA:
- `.env.local` is READ-ONLY. Never modify or regenerate it. If a change is necessary, write `.env.local.patch` and pause.
- Use the provided `DATABASE_URL` and `REDIS_URL` exactly. Do not create new databases or change Redis DB index.
- Run Playwright headless (`use.headless=true`). Do not open a browser or use `--ui`.
- Before any destructive operation (env edits, DB drops, force pushes), STOP and ask for approval.

=== ACCEPTANCE CRITERIA (DONE MEANS) ===
ARCHITECTURE & CODE
1) **Auth guard**: Unauthenticated POST /api/bookmarks returns 401.
2) **DB schema** (Prisma): `User(id, email, name?, createdAt)` and `Bookmark(id, userId, url, title, createdAt)`.
3) **Create**: `POST /api/bookmarks { url, title? }` → 201 with JSON record; validates URL.
4) **List**: `GET /api/bookmarks` returns current user’s bookmarks, newest first.
5) **Top list (cached)**: `GET /api/bookmarks/top` uses Redis with TTL=60s; cache invalidated on create.
6) **Rate limit**: per-user N/min (N=5). On exceed, return 429 + `Retry-After`.
7) **Feature flag**: `CACHE_ENABLED=true|false` — when false, skip all Redis code paths cleanly.
8) **Observability**: structured logs include request_id, user_id, op, latency.

TESTS & CI
9) **Unit tests (Vitest)**: at least 3 — rate limiter logic; cache invalidation path; input validation.
10) **Playwright E2E**:
    - Login → add bookmark → see it listed.
    - Add until limit → expect 429 and `Retry-After`.
11) **Package scripts** exist: `test`, `e2e`, `lint/format` (use Biome if present).

DOCS
12) **README** updated with run instructions.
13) **CHANGELOG** entry describing this feature.
14) **DECISIONS.md** with chosen rate-limit strategy (token bucket vs sliding window), cache policy, and trade-offs.

=== CONSTRAINTS & TOOLS ===
- Use **Prisma** with the existing `DATABASE_URL`. Generate schema/migrations and Prisma Client.
- Use **Redis** from `REDIS_URL`. TTL 60s, invalidate on create.
- UI: minimal Next.js page with form (add bookmark) and list view; Tailwind optional.
- Rate limiting: library or simple in-DB/Redis approach; justify in DECISIONS.md.

BEGIN

