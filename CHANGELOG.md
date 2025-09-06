## Unreleased

- feat(bookmarks): Rate-limited bookmarks with Postgres persistence, Redis caching for top list (TTL 60s) with invalidation on create, per-user 5/min rate limit, minimal Next.js UI, and tests (Vitest unit + Playwright E2E). Includes feature flag `CACHE_ENABLED` and structured logs with `request_id`, `user_id`, `op`, and `latency`.

