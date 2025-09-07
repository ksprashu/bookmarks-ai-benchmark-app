'use client'

import { useState, useEffect, useCallback } from 'react'

interface Bookmark {
  id: string
  url: string
  title?: string
  createdAt: string
}

interface TopBookmark extends Bookmark {
  user: {
    email: string
    name?: string
  }
}

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [topBookmarks, setTopBookmarks] = useState<TopBookmark[]>([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('test@example.com')

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await fetch('/api/bookmarks', {
        headers: {
          'x-user-email': userEmail
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBookmarks(data)
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    }
  }, [userEmail])

  const fetchTopBookmarks = useCallback(async () => {
    try {
      const response = await fetch('/api/bookmarks/top', {
        headers: {
          'x-user-email': userEmail
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTopBookmarks(data)
      }
    } catch (error) {
      console.error('Error fetching top bookmarks:', error)
    }
  }, [userEmail])

  useEffect(() => {
    fetchBookmarks()
    fetchTopBookmarks()
  }, [userEmail, fetchBookmarks, fetchTopBookmarks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ url, title })
      })

      if (response.ok) {
        setUrl('')
        setTitle('')
        fetchBookmarks()
        fetchTopBookmarks()
      } else {
        const errorData = await response.json()
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          setError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`)
        } else {
          setError(errorData.error || 'Failed to add bookmark')
        }
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Rate-Limited Bookmarks</h1>
        
        <div className="mb-4">
          <label htmlFor="userEmail" className="block text-sm font-medium mb-2">
            User Email (for demo):
          </label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-sm"
          />
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Add Bookmark</h2>
          
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              URL *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="https://example.com"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              placeholder="My awesome bookmark"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Bookmark'}
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Bookmarks</h2>
          <div className="space-y-3">
            {bookmarks.length === 0 ? (
              <p className="text-gray-500">No bookmarks yet. Add one above!</p>
            ) : (
              bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="border p-4 rounded">
                  <h3 className="font-medium">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {bookmark.title || bookmark.url}
                    </a>
                  </h3>
                  {bookmark.title && (
                    <p className="text-sm text-gray-600 mt-1">{bookmark.url}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(bookmark.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Top Bookmarks</h2>
          <div className="space-y-3">
            {topBookmarks.length === 0 ? (
              <p className="text-gray-500">No bookmarks yet.</p>
            ) : (
              topBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="border p-4 rounded">
                  <h3 className="font-medium">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {bookmark.title || bookmark.url}
                    </a>
                  </h3>
                  {bookmark.title && (
                    <p className="text-sm text-gray-600 mt-1">{bookmark.url}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    by {bookmark.user.name || bookmark.user.email} •{' '}
                    {new Date(bookmark.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
