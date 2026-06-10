'use client'

import { useEffect, useState } from 'react'

export function LikeButton({ slug }: { slug: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    fetch(`/api/like?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.count === 'number') setCount(d.count)
        if (typeof d.liked === 'boolean') setLiked(d.liked)
      })
      .catch(() => {})
  }, [slug])

  async function toggle() {
    if (loading) return
    setLoading(true)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (typeof data.count === 'number') setCount(data.count)
      if (typeof data.liked === 'boolean') setLiked(data.liked)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: liked ? 'var(--accent)' : 'var(--surface)',
        color: liked ? 'white' : 'var(--text)',
        border: `2px solid ${liked ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: liked ? '0 4px 12px rgba(200,75,49,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
      aria-label={liked ? 'いいねを取り消す' : 'いいねする'}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: animating ? 'scale(1.4)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-hidden="true"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
      </svg>
      <span>{liked ? 'いいね済み' : 'いいね'}</span>
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: liked ? 'rgba(255,255,255,0.25)' : 'var(--accent-light)',
          color: liked ? 'white' : 'var(--accent)',
        }}
      >
        {count}
      </span>
    </button>
  )
}
