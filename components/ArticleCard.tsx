import Link from 'next/link'
import { Article } from '@/lib/supabase'

// カテゴリごとの色定義（バッジ用 + サムネイルグラデ用）
const CATEGORY_THEME: Record<string, { badge: string; text: string; from: string; to: string; icon: string }> = {
  'ES・自己PR':           { badge: '#FEF3C7', text: '#92400E', from: '#FCD34D', to: '#F59E0B', icon: '✍️' },
  '面接対策':             { badge: '#DBEAFE', text: '#1E40AF', from: '#60A5FA', to: '#2563EB', icon: '🎤' },
  'インターン':           { badge: '#D1FAE5', text: '#065F46', from: '#34D399', to: '#059669', icon: '💼' },
  '業界研究':             { badge: '#EDE9FE', text: '#5B21B6', from: '#A78BFA', to: '#7C3AED', icon: '🔍' },
  '企業研究':             { badge: '#FFEDD5', text: '#9A3412', from: '#FB923C', to: '#EA580C', icon: '🏢' },
  'OB・OG訪問':          { badge: '#CCFBF1', text: '#115E59', from: '#5EEAD4', to: '#0D9488', icon: '🤝' },
  'SPI・筆記試験':        { badge: '#CFFAFE', text: '#155E75', from: '#67E8F9', to: '#0891B2', icon: '📝' },
  '就活マナー':           { badge: '#EDE9FE', text: '#4C1D95', from: '#A78BFA', to: '#6D28D9', icon: '👔' },
  '就活サイト比較':       { badge: '#FCE7F3', text: '#9D174D', from: '#F472B6', to: '#DB2777', icon: '⚖️' },
  '就活スケジュール':     { badge: '#E0E7FF', text: '#3730A3', from: '#818CF8', to: '#4338CA', icon: '📅' },
  'キャリア設計':         { badge: '#FCE7F3', text: '#9D174D', from: '#F472B6', to: '#BE185D', icon: '🌟' },
  '留学・海外就活':       { badge: '#D1FAE5', text: '#064E3B', from: '#34D399', to: '#047857', icon: '✈️' },
}

const DEFAULT_THEME = { badge: '#FEE2E2', text: '#991B1B', from: '#F87171', to: '#DC2626', icon: '📄' }
const getTheme = (c: string) => CATEGORY_THEME[c] ?? DEFAULT_THEME

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const readingTime = Math.max(1, Math.ceil(article.content.length / 400))
  const theme = getTheme(article.category)

  return (
    <article
      className="card-lift rounded-xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* サムネイル: カテゴリ別グラデーション + アイコン */}
      <Link
        href={`/articles/${article.slug}`}
        className="block relative overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-105"
        style={{
          aspectRatio: '2/1',
          background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
        }}
      >
        {/* 大きなアイコン背景 */}
        <span
          className="absolute text-9xl opacity-25 select-none"
          style={{ filter: 'blur(0.5px)' }}
          aria-hidden="true"
        >
          {theme.icon}
        </span>
        {/* カテゴリ名（白文字） */}
        <span
          className="relative z-10 text-base md:text-lg font-black tracking-wide text-white drop-shadow-lg"
          style={{ fontFamily: 'var(--font-serif)', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        >
          {article.category}
        </span>
        {/* 小さなカテゴリバッジ */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full tracking-wide"
          style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            color: theme.text,
            backdropFilter: 'blur(4px)',
          }}
        >
          {theme.icon} {article.category}
        </span>
      </Link>

      {/* コンテンツ */}
      <div className={`flex flex-col flex-1 ${featured ? 'p-7' : 'p-5'}`}>
        {/* メタ情報 */}
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            約{readingTime}分
          </span>
          <span>·</span>
          <time dateTime={article.created_at}>
            {new Date(article.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
          </time>
        </div>

        {/* タイトル */}
        <Link href={`/articles/${article.slug}`} className="group block mb-3">
          <h2
            className={`font-black leading-snug group-hover:opacity-60 transition-opacity duration-200 ${featured ? 'text-2xl' : 'text-base'}`}
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}
          >
            {article.title}
          </h2>
        </Link>

        {/* 概要 */}
        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: 'var(--text-muted)' }}>
          {article.meta_desc.length > 90 ? article.meta_desc.slice(0, 88) + '…' : article.meta_desc}
        </p>

        {/* タグ（最大3個） */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="text-xs px-2 py-0.5 rounded transition-all hover:opacity-70"
                style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)' }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <Link
          href={`/articles/${article.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase hover:gap-3 transition-all duration-200 mt-auto"
          style={{ color: 'var(--accent)' }}
        >
          続きを読む <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
