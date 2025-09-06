'use client';

import { useState } from 'react';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkList } from '@/components/BookmarkList';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBookmarkCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Add a new bookmark</h2>
          <BookmarkForm onBookmarkCreated={handleBookmarkCreated} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Your bookmarks</h2>
          <BookmarkList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
