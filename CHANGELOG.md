# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-07

### Added

**Rate-Limited Bookmarks Feature**

- **Database Schema**: Added Prisma schema with User and Bookmark models
  - User: id, email, name?, createdAt
  - Bookmark: id, userId, url, title?, createdAt with foreign key relationship
- **Authentication System**: Simple header-based authentication for demo purposes
  - Uses `x-user-email` header to identify users
  - Auto-creates users on first request
- **API Endpoints**:
  - `POST /api/bookmarks` - Create bookmarks with URL validation and rate limiting
  - `GET /api/bookmarks` - List user's bookmarks, newest first
  - `GET /api/bookmarks/top` - Get top bookmarks across all users (cached)
- **Rate Limiting**: Per-user rate limiting (5 requests/minute) with proper 429 responses
  - Redis-based sliding window implementation using sorted sets
  - Database fallback when Redis is disabled
  - Proper `Retry-After` headers
- **Redis Caching**: Top bookmarks endpoint with 60-second TTL
  - Cache invalidation on bookmark creation
  - Feature flag support (`CACHE_ENABLED`) to disable Redis cleanly
- **Structured Logging**: JSON logging with request tracking
  - Request ID, user ID, operation name, latency measurements
  - Error logging with context
- **User Interface**: Minimal responsive UI for bookmark management
  - Form to add bookmarks with URL and title fields
  - User bookmarks list with newest first
  - Top bookmarks list showing bookmarks from all users
  - Demo user email selector for testing
- **Testing**:
  - 3 unit tests covering rate limiting, URL validation, and cache invalidation
  - Playwright E2E tests for user flows and rate limiting
  - Test configuration for both Vitest and Playwright
- **Package Scripts**: Added comprehensive npm scripts for development and testing

### Infrastructure

- **Dependencies**: Added Redis client, UUID, Vitest, and testing utilities
- **Configuration**: Vitest and Playwright configuration files
- **Environment**: Support for `CACHE_ENABLED`, `DATABASE_URL`, `REDIS_URL`

### Documentation

- **README**: Updated with implementation details and run instructions
- **DECISIONS**: Technical architecture decisions (see DECISIONS.md)

## [0.1.0] - 2025-01-05

### Added

- Initial Next.js project setup with TypeScript and Tailwind CSS
- Basic project structure and configuration
- Environment setup documentation for Postgres and Redis