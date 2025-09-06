# Feature Implementation Plan: Rate-Limited Bookmarks

## 📋 Todo Checklist
- [x] ~~Setup Environment & Dependencies~~ ✅ Implemented
- [ ] Database Schema & Prisma Setup
- [ ] Backend API Implementation
- [ ] Rate Limiting & Caching Logic
- [ ] Frontend UI Development
- [ ] Unit & E2E Testing
- [ ] Documentation Updates
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### Codebase Structure
The project is a standard Next.js 15 application using the App Router structure. Key directories are `src/app` for pages and API routes, and `public` for static assets. Configuration files like `next.config.ts`, `tsconfig.json`, and `eslint.config.mjs` are present at the root. The project uses `pnpm` as its package manager.

### Current Architecture
The current architecture is a minimal Next.js setup with no existing data persistence, caching, or authentication layers. The UI is the default Next.js starter page. The plan must introduce these new layers from scratch. I will use Next.js API Routes for the backend, Prisma for the ORM, a new Redis client for caching and rate limiting, and a simple, mock authentication mechanism to fulfill the "per-user" requirements.

### Files Inspected
- `package.json`: Confirmed dependencies (Next.js, React, Prisma, Playwright, ESLint, Tailwind CSS) and identified missing ones (Vitest, Redis client, rate-limiting library).
- `src/app/page.tsx`: Inspected the boilerplate UI that needs to be replaced.
- `next.config.ts`: Confirmed no custom Next.js configuration is currently in place.
- `eslint.config.mjs`: Noted the use of ESLint for linting.

### Dependencies & Integration Points
The following new dependencies will be required:
- **`@upstash/redis`**: A robust and serverless-friendly Redis client.
- **`@upstash/ratelimit`**: A simple and effective rate-limiting library built on top of Redis.
- **`vitest` & `@vitest/ui`**: For unit testing.
- **`zod`**: For robust input validation on API routes.

Integration points will be:
- **PostgreSQL**: Via Prisma, using the `DATABASE_URL` from `.env.local`.
- **Redis**: Via `@upstash/redis`, using the `REDIS_URL` from `.env.local`.
- **Frontend-Backend**: The Next.js frontend will communicate with the backend via the API routes.

### Considerations & Challenges
- **Authentication**: The prompt requires per-user rate limiting but there is no auth system. I will implement a mock user system where the user ID is passed via a header (`x-user-id`) to simulate a multi-user environment without the complexity of a full auth implementation. This should be clearly documented.
- **Environment Variables**: The plan relies on `DATABASE_URL` and `REDIS_URL` being present in a read-only `.env.local` file. All new environment variables (`CACHE_ENABLED`) must also be sourced from there.
- **Tooling**: The project uses ESLint, not Biome. The plan will stick to the existing ESLint setup. New package scripts for `test` and `e2e` must be added to `package.json`.

## 📝 Implementation Plan

### Prerequisites
1.  Ensure `pnpm` is installed globally (`npm install -g pnpm`).
2.  Ensure the `.env.local` file exists and contains the `DATABASE_URL` and `REDIS_URL` variables. Add `CACHE_ENABLED=true` to this file.
3.  Run `pnpm install` to install existing dependencies.

### Step-by-Step Implementation

1.  **Install New Dependencies**
    - **Action**: Run the following command to add all required dependencies for the feature.
    - **Command**: `pnpm add @upstash/redis @upstash/ratelimit zod && pnpm add -D vitest @vitest/ui @testing-library/react`
    - **Files to modify**: `package.json`, `pnpm-lock.yaml`
    - **Implementation Notes**: Dependencies installed successfully.
    - **Status**: ✅ Completed

2.  **Configure Prisma and Database Schema**
    - **Action**: Create the Prisma schema, generate the Prisma Client, and create the initial database migration.
    - **Files to create**: `prisma/schema.prisma`
    - **`prisma/schema.prisma` content**:
      ```prisma
      generator client {
        provider = "prisma-client-js"
      }

      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }

      model User {
        id        String     @id @default(cuid())
        email     String     @unique
        name      String?
        createdAt DateTime   @default(now())
        bookmarks Bookmark[]
      }

      model Bookmark {
        id        String   @id @default(cuid())
        url       String
        title     String?
        createdAt DateTime @default(now())
        userId    String
        user      User     @relation(fields: [userId], references: [id])

        @@index([userId])
      }
      ```
    - **Commands**:
      1.  `pnpm prisma db push --preview-feature` (To sync schema with the DB without creating a migration file for simplicity, or `pnpm prisma migrate dev --name init` for a formal migration).
      2.  `pnpm prisma generate` (To generate the Prisma Client).

3.  **Setup Lib Utilities (Redis, Rate Limiter, Logging)**
    - **Action**: Create utility files for shared clients and functions.
    - **Files to create**: `src/lib/prisma.ts`, `src/lib/redis.ts`, `src/lib/ratelimit.ts`, `src/lib/logger.ts`, `src/lib/auth.ts`.
    - **`src/lib/prisma.ts`**: Instantiate and export a single Prisma Client instance.
    - **`src/lib/redis.ts`**: Instantiate and export a Redis client, conditionally based on `process.env.CACHE_ENABLED`.
    - **`src/lib/ratelimit.ts`**: Configure and export the `@upstash/ratelimit` instance.
    - **`src/lib/logger.ts`**: A simple structured logger function.
    - **`src/lib/auth.ts`**: A function to get the mock user ID from request headers.

4.  **Implement Bookmark API Routes**
    - **Action**: Create the API endpoints for managing bookmarks.
    - **Files to create**:
        - `src/app/api/bookmarks/route.ts` (for `GET` and `POST`)
        - `src/app/api/bookmarks/top/route.ts` (for `GET /top`)
    - **Changes needed**:
        - **`POST /api/bookmarks`**:
            - Get user ID from headers. Return 401 if missing.
            - Implement rate limiting (5 requests/minute). Return 429 if exceeded.
            - Validate input (`url`) using Zod. Return 400 on invalid input.
            - Create the bookmark in the database using Prisma.
            - Invalidate the "top bookmarks" cache in Redis.
            - Return 201 with the created bookmark.
        - **`GET /api/bookmarks`**:
            - Get user ID from headers.
            - Fetch bookmarks for that user from the database, ordered by `createdAt` descending.
            - Return 200 with the list of bookmarks.
        - **`GET /api/bookmarks/top`**:
            - If caching is enabled, first check Redis for a cached list. If found, return it.
            - If not in cache, fetch the top 10 most bookmarked URLs across all users from the database.
            - Store the result in Redis with a 60-second TTL.
            - Return 200 with the list.

5.  **Build the Frontend UI**
    - **Action**: Replace the default Next.js homepage with a minimal UI for creating and listing bookmarks.
    - **Files to modify**: `src/app/page.tsx`
    - **Changes needed**:
        - Use React Server Components to fetch and display the initial list of bookmarks for a mock user.
        - Use React Client Components and state (`useState`) for the form to add a new bookmark.
        - The form should have an input for the URL and an optional title.
        - On submission, it should make a `POST` request to `/api/bookmarks`.
        - The list of bookmarks should update optimistically or by re-fetching after a successful creation.
        - Display error messages from the API (e.g., rate limit exceeded, invalid URL).

6.  **Configure Testing and Add Scripts**
    - **Action**: Configure Vitest and add package scripts for testing and linting.
    - **Files to create**: `vitest.config.ts`
    - **Files to modify**: `package.json`
    - **`vitest.config.ts` content**:
      ```typescript
      import { defineConfig } from 'vitest/config';
      import react from '@vitejs/plugin-react';

      export default defineConfig({
        plugins: [react()],
        test: {
          environment: 'jsdom',
        },
      });
      ```
    - **`package.json` scripts update**:
      ```json
      "scripts": {
        ...
        "test": "vitest",
        "test:ui": "vitest --ui",
        "e2e": "playwright test",
        "lint": "eslint .",
        "format": "eslint . --fix"
      },
      ```

7.  **Write Unit and E2E Tests**
    - **Action**: Create test files to ensure the feature works as expected.
    - **Files to create**:
        - `src/lib/__tests__/ratelimit.test.ts`
        - `src/app/api/bookmarks/__tests__/validation.test.ts`
        - `src/lib/__tests__/cache.test.ts`
        - `tests/bookmarks.spec.ts` (Playwright E2E test)
    - **Unit Tests (Vitest)**:
        - **Rate Limiter**: Mock Redis and test that the rate limiter correctly allows requests before the limit and blocks them after.
        - **Input Validation**: Test the Zod schema for URL validation with valid and invalid URLs.
        - **Cache Invalidation**: Test that creating a bookmark successfully triggers a cache deletion call.
    - **E2E Tests (Playwright)**:
        - **Scenario 1 (Success)**:
            1.  Navigate to the homepage.
            2.  Fill and submit the "add bookmark" form.
            3.  Verify the new bookmark appears in the list.
        - **Scenario 2 (Rate Limit)**:
            1.  Navigate to the homepage.
            2.  Submit the form 6 times in quick succession.
            3.  Verify that the first 5 succeed and the 6th fails with a 429 status code and a visible error message.

8.  **Update Documentation**
    - **Action**: Create and update documentation files to reflect the new feature.
    - **Files to create**: `CHANGELOG.md`, `DECISIONS.md`
    - **Files to modify**: `README.md`
    - **`README.md`**: Add sections on how to set up the `.env.local` file, run the application, and run the tests.
    - **`CHANGELOG.md`**: Add an entry for the "Rate-Limited Bookmarks" feature.
    - **`DECISIONS.md`**: Create a new architectural decision record explaining:
        - **Rate Limiting Strategy**: Chose Sliding Window with `@upstash/ratelimit` for its ease of use, performance, and serverless compatibility.
        - **Caching Policy**: Chose a time-based TTL (60s) for the "top bookmarks" list with invalidation on write to balance freshness and performance.
        - **Authentication**: Documented the mock `x-user-id` header approach as a stand-in for a real auth system to meet per-user requirements.

## 🎯 Success Criteria
The feature is complete when all acceptance criteria from the prompt are met:
1.  Unauthenticated POST requests are rejected.
2.  The Prisma schema is correctly implemented.
3.  The `POST /api/bookmarks` endpoint works and validates URLs.
4.  The `GET /api/bookmarks` endpoint returns user-specific bookmarks.
5.  The `GET /api/bookmarks/top` endpoint is cached via Redis with a 60s TTL and invalidates on creation.
6.  The rate limit of 5 requests/minute per user is enforced.
7.  The `CACHE_ENABLED` feature flag correctly gates all Redis logic.
8.  API logs are structured and contain required metadata.
9.  All specified unit tests pass.
10. Both Playwright E2E scenarios pass.
11. All new `package.json` scripts run successfully.
12. `README.md`, `CHANGELOG.md`, and `DECISIONS.md` are all created and updated.
