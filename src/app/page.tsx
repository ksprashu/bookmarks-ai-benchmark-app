'use client';

import { useState, useEffect } from 'react';

type Bookmark = {
  id: string;
  url: string;
  title: string | null;
  createdAt: string;
};

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [topBookmarks, setTopBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('user-1'); // Mock user ID

  const fetchBookmarks = async () => {
    const res = await fetch('/api/bookmarks', {
      headers: { 'x-user-id': userId },
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data);
    }
  };

  const fetchTopBookmarks = async () => {
    const res = await fetch('/api/bookmarks/top');
    if (res.ok) {
      const data = await res.json();
      setTopBookmarks(data);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchTopBookmarks();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ url, title }),
    });

    if (res.ok) {
      setUrl('');
      setTitle('');
      await fetchBookmarks();
      await fetchTopBookmarks();
    } else {
      const data = await res.json();
      setError(data.error || 'Something went wrong');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create Bookmark</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Create
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">My Bookmarks</h2>
          <ul>
            {bookmarks.map((bookmark) => (
              <li key={bookmark.id} className="mb-2">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {bookmark.title || bookmark.url}
                </a>
                <p className="text-sm text-gray-500">{new Date(bookmark.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Top 10 Bookmarks (Cached)</h2>
          <ul>
            {topBookmarks.map((bookmark) => (
              <li key={bookmark.id} className="mb-2">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {bookmark.title || bookmark.url}
                </a>
                <p className="text-sm text-gray-500">{new Date(bookmark.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}