"use client";

import { useState, useEffect, FormEvent } from 'react';

interface Bookmark {
  id: string;
  url: string;
  title: string | null;
  createdAt: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userId = 'user_123'; // Mock user ID

  const fetchBookmarks = async () => {
    const res = await fetch('/api/bookmarks', {
      headers: {
        'x-user-id': userId,
      },
    });
    const data = await res.json();
    setBookmarks(data);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
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
      fetchBookmarks();
    } else {
      const data = await res.json();
      setError(data.error?.issues[0]?.message || 'An error occurred.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">My Bookmarks</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md mb-8">
        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Bookmark
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Existing Bookmarks</h2>
        <ul>
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="mb-4 p-4 border border-gray-200 rounded-md">
              <p className="text-lg font-semibold">{bookmark.title || bookmark.url}</p>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 break-all">
                {bookmark.url}
              </a>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(bookmark.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}