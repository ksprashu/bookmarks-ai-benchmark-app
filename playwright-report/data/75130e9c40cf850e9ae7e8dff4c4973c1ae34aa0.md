# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - heading "Bookmarks" [level=1] [ref=e3]
    - generic [ref=e4]:
      - heading "Create Bookmark" [level=2] [ref=e5]
      - generic [ref=e6]:
        - textbox "URL" [ref=e7]: https://example.com/0.07993986495461214
        - textbox "Title (optional)" [ref=e8]: Test Bookmark
        - button "Create" [active] [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "My Bookmarks" [level=2] [ref=e12]
        - list
      - generic [ref=e13]:
        - heading "Top 10 Bookmarks (Cached)" [level=2] [ref=e14]
        - list
  - generic [ref=e19] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e20] [cursor=pointer]:
      - img [ref=e21] [cursor=pointer]
    - generic [ref=e24] [cursor=pointer]:
      - button "Open issues overlay" [ref=e25] [cursor=pointer]:
        - generic [ref=e26] [cursor=pointer]:
          - generic [ref=e27] [cursor=pointer]: "0"
          - generic [ref=e28] [cursor=pointer]: "1"
        - generic [ref=e29] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e30] [cursor=pointer]:
        - img [ref=e31] [cursor=pointer]
  - alert [ref=e33]
```