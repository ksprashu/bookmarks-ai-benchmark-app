# Architectural Decision Records

This document records the architectural decisions made for this project.

## ADR-001: Rate-Limiting Strategy

### Context

We need to implement a per-user rate limit on the bookmark creation endpoint (`POST /api/bookmarks`) to prevent abuse and ensure service stability. The requirement is for a simple N requests per minute limit.

### Decision

We have chosen to use a **Sliding Window** algorithm, implemented with the `@upstash/ratelimit` library, using Redis as the backend.

- **Algorithm:** Sliding Window. This provides a fair and accurate rate limit over a rolling time window, preventing users from bursting requests at the boundary of a fixed window.
- **Library:** `@upstash/ratelimit`. This is a simple, well-maintained, and serverless-first library that integrates cleanly with our Redis client (`@upstash/redis`).
- **Backend:** Redis. It provides the necessary performance for a rate-limiting implementation and is already a required part of our stack for caching.

### Trade-offs

- **Token Bucket vs. Sliding Window:** A token bucket algorithm allows for more burstiness, which can be desirable for some use cases. However, for our simple "N requests per minute" requirement, a sliding window is more direct and prevents a user from saving up tokens for a large burst.
- **In-memory vs. Redis:** An in-memory solution would not work as it would be local to each server instance and not scale. A distributed solution was required.
- **Custom vs. Library:** Building a custom sliding window implementation in Redis is non-trivial. Using a library like `@upstash/ratelimit` is faster, less error-prone, and more maintainable.

## ADR-002: Caching Policy

### Context

We need a caching layer for the "top bookmarks" endpoint (`GET /api/bookmarks/top`) to reduce database load and improve response times for this potentially high-traffic endpoint.

### Decision

We have implemented a **time-to-live (TTL) cache** in Redis with a **cache-aside** strategy and **write-through invalidation**.

- **Strategy:** Cache-Aside. The application logic first checks Redis for the data. If it's a cache miss, it queries the database, populates the cache with the result, and then returns the data.
- **TTL:** 60 seconds. This provides a good balance between serving fresh data and reducing database load.
- **Invalidation:** The cache for the `top-bookmarks` key is explicitly invalidated (deleted) whenever a new bookmark is created via `POST /api/bookmarks`. This ensures that the top bookmarks list is updated reasonably quickly after new data is added.

### Trade-offs

- **TTL vs. Manual Invalidation:** Relying purely on a TTL is simpler but can lead to stale data being served for up to a minute. Explicitly invalidating the cache on write operations provides better data freshness. We use both for a robust solution.
- **Cache-Aside vs. Read-Through:** Read-through caching is handled by the data store itself, which is not a feature of our Prisma/Postgres setup. Cache-aside is the standard application-level implementation.
