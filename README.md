# Bookmarks App – Gemini CLI Testbed

This repo is a **sandbox** for testing Gemini CLI planning modes.

Each test runs in its own **git branch**, with its own **Postgres DB** and **Redis DB index**, ensuring clean isolation.

---

## 1. Prerequisites

- **Node.js** 22 LTS
- **pnpm** → `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** → required for Postgres + Redis

---

## 2. Environment Setup

### 2.1 Start Postgres + Redis

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

### 2.2 Create `.env.local`

Create a `.env.local` file in the root of the project and populate it with the necessary environment variables. See `.env.local.example` for a template. You will need to generate a `NEXTAUTH_SECRET`.

### 2.3 Create Database

```bash
docker exec -it pg psql -U postgres -c "CREATE DATABASE bookmarks_stock;"
```

---

## 3. Running the Application

### 3.1 Install Dependencies
```bash
pnpm install
```

### 3.2 Run Database Migrations
```bash
pnpm prisma migrate dev
```

### 3.3 Start the Development Server
```bash
pnpm dev
```

The application will be available at [http://localhost:3002](http://localhost:3002).

---

## 4. Running Tests

### 4.1 Unit Tests
```bash
pnpm test
```

### 4.2 End-to-End Tests

The E2E tests are run using Cypress.

**Prerequisites for WSL2:**
If you are running this on WSL2, you may need to install some system-level dependencies for the browser to run headlessly.
```bash
sudo apt-get update && sudo apt-get install -y libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2t64 libxtst6 xauth xvfb
```

**Run the tests:**
```bash
pnpm e2e
```
This command will automatically start the dev server and run the Cypress tests in headless mode.

```
