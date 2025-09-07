# Architecture Decisions

This document records the key architectural decisions made for the Rate-Limited Bookmarks feature.

## Rate Limiting Strategy

**Decision**: Sliding Window using Redis Sorted Sets with Database Fallback

### Considered Options

1. **Token Bucket**: Fixed number of tokens replenished at regular intervals
2. **Fixed Window**: Simple counter that resets at fixed time intervals  
3. **Sliding Window (Redis)**: Precise per-user rate limiting using sorted sets
4. **Database-only**: Store request timestamps in database

### Chosen: Sliding Window (Redis) + Database Fallback

**Rationale**:
- **Precision**: Sliding window provides accurate rate limiting without burst allowance issues
- **Performance**: Redis operations are fast and atomic
- **Scalability**: Distributed rate limiting across multiple app instances
- **Resilience**: Database fallback ensures functionality when Redis is unavailable
- **Memory Efficiency**: Automatic cleanup of old entries via `EXPIRE`

**Trade-offs**:
- ✅ More accurate than fixed windows
- ✅ Prevents burst attacks better than token bucket
- ✅ Scales horizontally
- ❌ Slightly more complex implementation
- ❌ Requires Redis for optimal performance

**Implementation Details**:
- Use Redis `ZSET` (sorted set) with timestamps as scores
- Remove expired entries with `ZREMRANGEBYSCORE`
- Count current entries with `ZCARD`
- Add new request with `ZADD`
- Set TTL with `EXPIRE` for cleanup

## Caching Strategy

**Decision**: Redis with TTL + Invalidation on Write

### Cache Policy

- **TTL**: 60 seconds for top bookmarks
- **Invalidation**: Clear cache on bookmark creation
- **Key Strategy**: Simple string keys (`top_bookmarks`)
- **Miss Behavior**: Query database and populate cache

### Rationale

**Why Redis**:
- Fast in-memory storage for low-latency reads
- Built-in TTL support
- Atomic operations for cache invalidation
- Horizontal scaling support

**Why 60-second TTL**:
- Balance between freshness and performance
- Reasonable for "top bookmarks" use case
- Reduces database load significantly

**Why Invalidate on Write**:
- Ensures consistency for user-facing data
- Simple to implement and reason about
- Acceptable performance trade-off for this use case

**Trade-offs**:
- ✅ Low latency for reads
- ✅ Reduces database load
- ✅ Simple invalidation logic
- ❌ Cache misses cause database hits
- ❌ Short-lived cache may not help under heavy write load

## Authentication Strategy

**Decision**: Header-based Authentication (Demo Only)

### Current Implementation

- Use `x-user-email` header to identify users
- Auto-create users on first request
- No password or session management

### Rationale

This is a **demo-only** authentication system designed for:
- Simple testing of rate limiting per user
- Easy E2E test automation
- Minimal implementation complexity

**Production Considerations**:
- Replace with proper JWT or session-based auth
- Add password hashing and secure storage
- Implement proper login/logout flows
- Add CSRF protection
- Use HTTPS-only cookies or secure headers

## Database Schema Design

**Decision**: Prisma with Normalized Schema

### Schema Structure

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  bookmarks Bookmark[]
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  url       String
  title     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}
```

### Rationale

**Why Normalized**:
- Clear separation of concerns
- Referential integrity with foreign keys
- Efficient queries with proper indexing

**Why CUID for IDs**:
- URL-safe, collision-resistant
- Sortable by creation time
- No auto-increment sequence contention

**Why Composite Index**:
- Optimizes `WHERE userId = ? ORDER BY createdAt DESC`
- Essential for user bookmark listing performance

## Error Handling Strategy

**Decision**: Structured Error Responses with Proper HTTP Status Codes

### HTTP Status Codes

- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Invalid URL format or missing required fields
- `429 Too Many Requests`: Rate limit exceeded (with `Retry-After` header)
- `500 Internal Server Error`: Unexpected server errors

### Structured Logging

- JSON format for machine readability
- Include request ID for request tracing
- Log user ID, operation, and latency for observability
- Error context without sensitive data

### Rationale

**Why Proper Status Codes**:
- Clear client error handling
- Standard HTTP semantics
- Good API design practices

**Why Retry-After Header**:
- RFC compliance for 429 responses
- Helps clients implement proper backoff
- Better user experience

## Feature Flag Strategy

**Decision**: Environment Variable Toggle

### Implementation

- `CACHE_ENABLED=true|false` environment variable
- Clean fallback to database-only operation
- No degraded functionality when disabled

### Rationale

**Why Environment Variable**:
- Simple deployment-time configuration
- No runtime feature flag service needed
- Clear binary choice (enabled/disabled)

**Why Clean Fallback**:
- Application works correctly with or without Redis
- Easier testing and local development
- Reduces operational complexity

## Testing Strategy

**Decision**: Multi-layer Testing with Vitest + Playwright

### Test Layers

1. **Unit Tests** (Vitest): Core logic, rate limiting, validation
2. **E2E Tests** (Playwright): Full user flows, API contracts
3. **Manual Testing**: Rate limit behavior, cache performance

### Rationale

**Why Vitest**:
- Fast execution with native ES modules
- Excellent TypeScript support
- Built-in mocking capabilities

**Why Playwright**:
- Real browser testing
- Network interception capabilities
- Stable selectors and assertions

**Test Coverage Focus**:
- Rate limiting edge cases
- Cache invalidation timing
- Authentication boundaries
- Error conditions

## Performance Considerations

### Database

- Index on `(userId, createdAt)` for efficient user bookmark queries
- Composite primary keys using CUID for distribution
- Connection pooling via Prisma

### Redis

- Sorted sets for efficient range queries
- TTL for automatic cleanup
- Pipelining for multiple operations

### Application

- Structured logging with minimal overhead
- Graceful degradation when Redis unavailable
- Async/await for non-blocking I/O

### Future Optimizations

- Database read replicas for bookmark listing
- Redis clustering for high availability
- CDN caching for static assets
- Pagination for large bookmark collections