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
