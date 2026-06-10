'use client'

import { useEffect, useState } from 'react'

type Comment = {
  id: string
  nickname: string
  content: string
  created_at: string
  likes: number
  liked: boolean
}

export function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!nickname.trim() || !content.trim()) {
      setError('ニックネームとコメント本文を入力してください')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, nickname: nickname.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '投稿に失敗しました')
        return
      }
      setComments([{ ...data.comment, likes: 0, liked: false }, ...comments])
      setNickname('')
      setContent('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      console.error(e)
      setError('投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleLike(commentId: string) {
    setComments(cs => cs.map(c => c.id === commentId ? { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) } : c))
    try {
      const res = await fetch('/api/comment-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      const data = await res.json()
      if (typeof data.count === 'number') {
        setComments(cs => cs.map(c => c.id === commentId ? { ...c, liked: data.liked, likes: data.count } : c))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width: 28, height: 2, backgroundColor: 'var(--accent)' }} />
        <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-serif)' }}>
          コメント <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({comments.length})</span>
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="grid sm:grid-cols-[180px_1fr] gap-3 mb-3">
          <input
            type="text"
            placeholder="ニックネーム"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            className="px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>
        <textarea
          placeholder="この記事の感想を書く（3〜1000文字、URL不可）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          rows={4}
          className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 resize-y"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{content.length} / 1000</span>
            {error && <span style={{ color: 'var(--accent)' }}>{error}</span>}
            {success && <span style={{ color: '#198754' }}>✓ 投稿しました</span>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {submitting ? '投稿中...' : 'コメントする'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>読み込み中...</p>
      ) : comments.length === 0 ? (
        <p className="text-center py-10 text-sm rounded-xl" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-alt)' }}>
          まだコメントはありません。最初のコメントを投稿しましょう！
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{c.nickname}</p>
                <time className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                </time>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--text)' }}>
                {c.content}
              </p>
              <button
                onClick={() => toggleLike(c.id)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: c.liked ? 'var(--accent)' : 'var(--surface-alt)',
                  color: c.liked ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${c.liked ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={c.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                {c.likes > 0 ? c.likes : '役立った'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
