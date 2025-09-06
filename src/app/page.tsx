"use client";
import { useEffect, useState } from "react";

type Bookmark = {
  id: string;
  url: string;
  title: string;
  createdAt: string;
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch("/api/bookmarks", { cache: "no-store" });
    if (res.status === 401) {
      setLoggedIn(false);
      setBookmarks([]);
    } else if (res.ok) {
      setLoggedIn(true);
      setBookmarks(await res.json());
    } else {
      setError("Failed to load bookmarks");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setEmail("");
      await load();
    } else {
      setError("Login failed");
    }
  }

  async function addBookmark(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, title }),
    });
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After") || "?";
      setError(`Rate limited. Retry after ${ra}s`);
      return;
    }
    if (res.ok) {
      setUrl("");
      setTitle("");
      await load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body?.error || "Failed to add bookmark");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Rate-Limited Bookmarks</h1>
      {error && (
        <div className="text-red-600 text-sm" data-testid="error">{error}</div>
      )}

      {loggedIn === false && (
        <form onSubmit={login} className="flex gap-2 items-center" data-testid="login-form">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <button className="border px-3 py-1 rounded bg-black text-white">Login</button>
        </form>
      )}

      {loggedIn && (
        <>
          <form onSubmit={addBookmark} className="flex gap-2 items-center" data-testid="add-form">
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border px-2 py-1 rounded w-full"
            />
            <button className="border px-3 py-1 rounded bg-black text-white">Add</button>
          </form>

          <ul className="divide-y" data-testid="bookmark-list">
            {bookmarks.map((b) => (
              <li key={b.id} className="py-2 flex flex-col">
                <a className="text-blue-700" href={b.url} target="_blank" rel="noreferrer">
                  {b.title}
                </a>
                <span className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
