# Changelog

## [0.1.0] - 2025-09-06

### Added

- Rate-Limited Bookmarks feature
  - Postgres persistence with Prisma
  - Redis caching for "top bookmarks" with invalidation
  - Per-user rate limiting on bookmark creation
  - Minimal Next.js UI to create and list bookmarks
  - Unit tests (Vitest) + E2E tests (Playwright)
  - Short docs updates (README/CHANGELOG/DECISIONS)
