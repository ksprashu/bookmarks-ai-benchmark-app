'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  const [bookmarks, setBookmarks] = useState([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (session) {
      fetch('/api/bookmarks')
        .then((res) => res.json())
        .then((data) => setBookmarks(data))
    }
  }, [session])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, title }),
    })
    if (res.ok) {
      const newBookmark = await res.json()
      setBookmarks([newBookmark, ...bookmarks])
      setUrl('')
      setTitle('')
    }
  }

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn('github')}>Sign in with GitHub</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <button onClick={() => signOut()}>Sign out</button>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add Bookmark</button>
      </form>
      <ul>
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id}>
            <a href={bookmark.url}>{bookmark.title || bookmark.url}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}