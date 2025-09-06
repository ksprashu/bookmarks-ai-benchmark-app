'use client';

import { useEffect, useState } from 'react';

interface Bookmark {
  id: string;
  url: string;
  title: string | null;
  createdAt: string;
}

export function BookmarkList({ refreshKey }: { refreshKey: number }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      setBookmarks(data);
    };
    fetchBookmarks();
  }, [refreshKey]);

  return (
    <ul className="space-y-4">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="rounded-md border border-gray-200 p-4">
          <a href={bookmark.url} className="text-lg font-medium text-indigo-600 hover:underline">
            {bookmark.title || bookmark.url}
          </a>
          <p className="text-sm text-gray-500">{new Date(bookmark.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
