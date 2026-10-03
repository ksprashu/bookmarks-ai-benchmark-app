'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

type Bookmark = {
  id: string;
  url: string;
  title: string | null;
  createdAt: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const fetchBookmarks = async () => {
    const res = await fetch('/api/bookmarks');
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookmarks();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title }),
    });

    if (res.ok) {
      setUrl('');
      setTitle('');
      fetchBookmarks();
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <button onClick={() => signIn('credentials', { email: 'test@example.com' })}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button onClick={() => signOut()}>Sign out</button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-4">
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
            Add Bookmark
          </button>
        </div>
      </form>

      <div>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="p-4 mb-4 border rounded">
            <h2 className="text-xl font-semibold">{bookmark.title || bookmark.url}</h2>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
              {bookmark.url}
            </a>
            <p className="text-sm text-gray-500">
              {new Date(bookmark.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}