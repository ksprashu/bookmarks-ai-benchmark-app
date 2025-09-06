# Architectural Decisions

## Rate Limiting Strategy

We chose a simple in-memory token bucket implementation for rate limiting. This was chosen for its simplicity and low overhead. A sliding window approach was considered, but was deemed overly complex for this use case.

## Caching Policy

We chose a simple time-to-live (TTL) caching policy for the "top bookmarks" endpoint. This was chosen for its simplicity and ease of implementation. A more complex caching policy, such as a least recently used (LRU) policy, was considered, but was deemed overly complex for this use case.
