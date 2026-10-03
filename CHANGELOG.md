# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-09-09

### Added

- **Rate-Limited Bookmarks Feature:**
  - Users can now create and view their own bookmarks.
  - Bookmark creation is rate-limited to 5 requests per minute per user.
  - A `GET /api/bookmarks/top` endpoint provides a cached list of the most popular bookmarks.
  - Implemented with a Next.js frontend, Prisma for Postgres persistence, and Redis for caching and rate-limiting.
  - Includes unit tests for core logic and a basic E2E test setup.
  - Added structured logging for all API endpoints.
