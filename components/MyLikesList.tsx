'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArticleCard } from './ArticleCard'
import type { Article } from '@/lib/supabase'

export function MyLikesList() {
  const [articles, setArticles] = useState<Article[] | null>(null)

  useEffect(() => {
    fetch('/api/my-likes')
      .then(r => r.json())
      .then(d => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
  }, [])

  if (articles === null) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>読み込み中...</p>
  }

  if (articles.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-5xl mb-4">❤️</div>
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
          まだいいねした記事はありません
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          気になる記事を読んでハートボタンを押してみましょう
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          記事を探す →
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        全 <span className="font-bold" style={{ color: 'var(--accent)' }}>{articles.length}</span> 記事
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((a) => <ArticleCard key={a.slug} article={a} />)}
      </div>
    </>
  )
}
