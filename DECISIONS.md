# Decisions

- Rate limit: Fixed window per-user using Redis `INCR` with 60s TTL. Simpler than sliding window/token bucket, sufficient for this demo. Returns `429` and `Retry-After` using Redis key TTL. If `CACHE_ENABLED=false`, limiter is bypassed (no Redis).

- Cache policy: `GET /api/bookmarks/top` caches the top 10 newest bookmarks for 60s under `top:bookmarks`. On any create, invalidate by `DEL top:bookmarks`. When `CACHE_ENABLED=false`, cache paths are skipped.

- Auth: Minimal session cookie signed via HMAC-SHA256 with `AUTH_SECRET`. `POST /api/auth/login` upserts user by email and sets cookie. `POST /api/bookmarks` requires auth; unauthenticated requests get `401`.

- Observability: JSON logs with `request_id`, `user_id`, `op`, and `latency_ms` are emitted around API operations.

