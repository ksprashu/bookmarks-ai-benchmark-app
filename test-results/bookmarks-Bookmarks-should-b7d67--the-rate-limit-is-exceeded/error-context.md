# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - heading "Bookmarks" [level=1] [ref=e3]
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Add a new bookmark" [level=2] [ref=e6]
        - generic [ref=e7]:
          - generic [ref=e8]:
            - generic [ref=e9]: URL
            - textbox "URL" [ref=e10]: https://example.com/0
          - generic [ref=e11]:
            - generic [ref=e12]: Title
            - textbox "Title" [ref=e13]: Example 0
          - button "Add Bookmark" [active] [ref=e14]
      - generic [ref=e15]:
        - heading "Your bookmarks" [level=2] [ref=e16]
        - list
  - generic [ref=e21] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
      - img [ref=e23] [cursor=pointer]
    - generic [ref=e26] [cursor=pointer]:
      - button "Open issues overlay" [ref=e27] [cursor=pointer]:
        - generic [ref=e28] [cursor=pointer]:
          - generic [ref=e29] [cursor=pointer]: "0"
          - generic [ref=e30] [cursor=pointer]: "1"
        - generic [ref=e31] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e32] [cursor=pointer]:
        - img [ref=e33] [cursor=pointer]
  - alert [ref=e35]
```