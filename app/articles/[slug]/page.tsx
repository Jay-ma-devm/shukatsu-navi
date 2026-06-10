import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { getArticleBySlug, getAllSlugs, getRelatedArticles, getPopularInCategory, getTotalCount } from '@/lib/supabase'
import { AffiliateBlock } from '@/components/AffiliateBlock'
import { LikeButton } from '@/components/LikeButton'
import { Comments } from '@/components/Comments'
import { CopyUrlButton } from '@/components/CopyUrlButton'
import { AdSense } from '@/components/AdSense'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { PopularInCategory } from '@/components/PopularInCategory'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.meta_desc,
    openGraph: {
      title: article.title,
      description: article.meta_desc,
      type: 'article',
      images: [`https://picsum.photos/seed/shukatsu-${slug}/1200/630`],
    },
  }
}

/** meta_desc から「わかること」3点を生成する */
function extractKeyPoints(metaDesc: string): string[] {
  const sentences = metaDesc
    .split(/[。、！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
  if (sentences.length >= 3) return sentences.slice(0, 3)
  if (sentences.length === 2) return [...sentences, 'おすすめの就活サービスや具体的な対策']
  return [metaDesc, 'この記事で押さえるべき重要ポイント', 'おすすめの就活サービスや具体的な対策']
}

/** H2見出しを抽出して目次データを返す */
function extractToc(markdown: string): { id: string; text: string }[] {
  const lines = markdown.split('\n')
  const toc: { id: string; text: string }[] = []
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/)
    if (match) {
      const text = match[1].trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w　-鿿＀-￯]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text })
    }
  }
  return toc
}

/**
 * marked が生成した HTML を allowlist 方式でサニタイズする。
 * sanitize-html は純 JS（htmlparser2 ベース・jsdom 非依存）なので、
 * Vercel ランタイムで ERR_REQUIRE_ESM クラッシュを起こす isomorphic-dompurify の
 * 代替として使える。記事本文に必要なタグ/属性のみ許可する。
 */
function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'a', 'ul', 'ol', 'li', 'blockquote',
      'strong', 'em', 'b', 'i', 'del', 's', 'mark', 'sup', 'sub',
      'code', 'pre', 'hr', 'br', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      h2: ['id'],
      h3: ['id'],
      th: ['align'],
      td: ['align'],
      span: ['class'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // 外部リンクは安全属性を強制
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  })
}

/** marked にID付きH2レンダラーを設定し、本文を安全にHTML化 */
function renderMarkdownSafe(content: string): string {
  const renderer = new marked.Renderer()
  const h2Count: Record<string, number> = {}

  renderer.heading = ({ text, depth }) => {
    if (depth === 2) {
      const id = text
        .toLowerCase()
        .replace(/[^\w　-鿿＀-￯]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      const count = h2Count[id] ?? 0
      const finalId = count > 0 ? `${id}-${count}` : id
      h2Count[id] = count + 1
      return `<h2 id="${finalId}">${text}</h2>`
    }
    return `<h${depth}>${text}</h${depth}>`
  }

  marked.use({ renderer })
  const raw = marked.parse(content) as string
  return sanitizeArticleHtml(raw)
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'

/** JSON-LD を XSS-safe にシリアライズする（< を unicode エスケープ） */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const [htmlContent, relatedArticles, popularInCategory, categoryCount] = await Promise.all([
    Promise.resolve(renderMarkdownSafe(article.content)),
    getRelatedArticles(article.category, article.tags ?? [], slug, 4),
    getPopularInCategory(article.category, slug, 5),
    getTotalCount(article.category),
  ])

  const toc = extractToc(article.content)
  const readingTime = Math.max(1, Math.ceil(article.content.length / 400))
  const keyPoints = extractKeyPoints(article.meta_desc)

  const publishedDate = new Date(article.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_desc,
    author: {
      '@type': 'Organization',
      name: '就活ナビ',
    },
    publisher: {
      '@type': 'Organization',
      name: '就活ナビ',
      url: BASE_URL,
    },
    datePublished: article.created_at,
    dateModified: article.created_at,
    image: `${BASE_URL}/og-default.png`,
    url: `${BASE_URL}/articles/${slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/articles/${slug}`,
    },
  }

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '就活ナビ',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category,
        item: `${BASE_URL}/category/${encodeURIComponent(article.category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${BASE_URL}/articles/${slug}`,
      },
    ],
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      {/* JSON-LD 構造化データ（XSS対策: < を unicode エスケープ済み） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <SiteHeader />

      {/* ===== Article Hero ===== */}
      <div style={{ backgroundColor: 'var(--dark-mid)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* カテゴリ別グラデーション + アイコンヒーロー */}
        {(() => {
          const themes: Record<string, { from: string; to: string; icon: string }> = {
            'ES・自己PR':      { from: '#FCD34D', to: '#F59E0B', icon: '✍️' },
            '面接対策':        { from: '#60A5FA', to: '#2563EB', icon: '🎤' },
            'インターン':      { from: '#34D399', to: '#059669', icon: '💼' },
            '業界研究':        { from: '#A78BFA', to: '#7C3AED', icon: '🔍' },
            '企業研究':        { from: '#FB923C', to: '#EA580C', icon: '🏢' },
            'OB・OG訪問':     { from: '#5EEAD4', to: '#0D9488', icon: '🤝' },
            'SPI・筆記試験':   { from: '#67E8F9', to: '#0891B2', icon: '📝' },
            '就活マナー':      { from: '#A78BFA', to: '#6D28D9', icon: '👔' },
            '就活サイト比較':  { from: '#F472B6', to: '#DB2777', icon: '⚖️' },
            '就活スケジュール':{ from: '#818CF8', to: '#4338CA', icon: '📅' },
            'キャリア設計':    { from: '#F472B6', to: '#BE185D', icon: '🌟' },
            '留学・海外就活':  { from: '#34D399', to: '#047857', icon: '✈️' },
          }
          const t = themes[article.category] ?? { from: '#F87171', to: '#DC2626', icon: '📄' }
          return (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 240,
                background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'absolute', fontSize: 200, opacity: 0.18 }} aria-hidden="true">{t.icon}</span>
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  color: 'white',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 900,
                  fontSize: 28,
                  textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                {article.category}
              </span>
            </div>
          )
        })()}
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-5" aria-label="パンくず" style={{ color: '#9CA3AF' }}>
            <Link href="/" className="hover:text-white transition-colors">就活ナビ</Link>
            <span>/</span>
            <Link
              href={`/category/${encodeURIComponent(article.category)}`}
              className="hover:text-white transition-colors"
            >
              {article.category}
              {categoryCount > 0 && (
                <span className="ml-1 opacity-60">({categoryCount}件)</span>
              )}
            </Link>
            <span>/</span>
            <span className="truncate max-w-xs" style={{ color: '#D1D5DB' }}>
              {article.title}
            </span>
          </nav>

          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {article.category}
          </span>
          <h1
            className="text-2xl md:text-3xl font-black leading-tight text-white mb-5"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {article.title}
          </h1>

          {/* 公開日・読了時間 — 目立つバッジデザイン */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#D1D5DB' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time dateTime={article.created_at}>{publishedDate}</time>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(200,75,49,0.25)',
                color: '#FCA99A',
                border: '1px solid rgba(200,75,49,0.4)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              約{readingTime}分で読めます
            </div>
          </div>

          {/* Tags in hero */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="text-xs px-3 py-1 rounded-full transition-all hover:opacity-70"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#D1D5DB',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Article Body + Sidebar ===== */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ===== Article Main Column ===== */}
          <article className="flex-1 min-w-0">
            {/* Ad: 記事冒頭 */}
            <div className="mb-10">
              <AdSense slot="top-banner" format="auto" />
            </div>

            {/* ===== この記事でわかること ===== */}
            <div
              className="rounded-xl mb-8 overflow-hidden"
              style={{
                border: '2px solid var(--accent)',
                boxShadow: '0 4px 20px rgba(200,75,49,0.12)',
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm font-bold text-white tracking-wide">この記事でわかること</p>
              </div>
              <div className="px-5 py-4" style={{ backgroundColor: '#FFF8F6' }}>
                <ul className="space-y-2.5">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                      <span
                        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white mt-0.5"
                        style={{
                          width: '1.35rem',
                          height: '1.35rem',
                          backgroundColor: 'var(--accent)',
                          fontSize: '0.7rem',
                          lineHeight: 1,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ===== Table of Contents ===== */}
            {toc.length > 0 && (
              <nav
                className="rounded-xl p-6 mb-10"
                aria-label="目次"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                  目次
                </p>
                <ol className="space-y-2">
                  {toc.map((item, i) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="flex items-start gap-2.5 text-sm hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span className="font-bold shrink-0" style={{ color: 'var(--accent)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{item.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Article content — sanitized by DOMPurify above */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* いいねボタン */}
            <div className="flex items-center justify-center mt-10 mb-2">
              <LikeButton slug={slug} />
            </div>
            <p className="text-center text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
              この記事が役に立ったらいいねを押してください
            </p>

            {/* Affiliate CTA */}
            <AffiliateBlock />

            {/* Ad: 記事末尾 */}
            <div className="mt-10">
              <AdSense slot="bottom-banner" format="auto" />
            </div>

            {/* ===== この記事のまとめ ===== */}
            <div
              className="rounded-xl mt-10 overflow-hidden"
              style={{ border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(13,27,42,0.07)' }}
            >
              <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'var(--dark-mid)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p className="text-sm font-bold text-white tracking-wide">この記事のまとめ</p>
              </div>
              <div className="px-5 py-5" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  {article.meta_desc}
                </p>
                {toc.length > 0 && (
                  <ul className="space-y-2">
                    {toc.slice(0, 5).map((tocItem, tocIdx) => (
                      <li key={tocIdx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        <a href={`#${tocItem.id}`} className="hover:opacity-70 transition-opacity" style={{ color: 'var(--text)' }}>
                          {tocItem.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ===== SNSシェアボタン ===== */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>シェアする</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${BASE_URL}/articles/${slug}`)}&text=${encodeURIComponent(article.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#000', color: 'white' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.243 2.25zM17.083 19.77h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X でシェア
                </a>
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${BASE_URL}/articles/${slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#06C755', color: 'white' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  LINE でシェア
                </a>
                <CopyUrlButton url={`${BASE_URL}/articles/${slug}`} />
              </div>
            </div>

            {/* ===== Tags (Bottom) ===== */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
                  関連タグ
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${encodeURIComponent(tag)}`}
                      className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
                      style={{
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(200,75,49,0.15)',
                      }}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  タグをクリックすると関連記事が一覧で見られます
                </p>
              </div>
            )}

            {/* Back link */}
            <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <Link
                href={`/category/${encodeURIComponent(article.category)}`}
                className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-70 transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                ← {article.category}の記事一覧へ
              </Link>
            </div>

            {/* ===== Related Articles — カラーバー付きカード ===== */}
            {relatedArticles.length > 0 && (
              <section className="mt-10 pt-10" style={{ borderTop: '2px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ width: 4, height: '1.5rem', backgroundColor: 'var(--accent)', borderRadius: 2 }} />
                  <h2 className="text-base font-black" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                    関連記事
                  </h2>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    {relatedArticles.length}件
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/articles/${rel.slug}`}
                      className="group card-lift rounded-xl overflow-hidden"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div style={{ height: 4, background: 'linear-gradient(90deg, #C84B31 0%, #E8693A 100%)' }} />
                      <div className="p-5">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block"
                          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                          {rel.category}
                        </span>
                        <p
                          className="text-sm font-bold leading-snug mb-2 group-hover:opacity-60 transition-opacity"
                          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}
                        >
                          {rel.title}
                        </p>
                        {rel.meta_desc && (
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {rel.meta_desc}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                          <span>続きを読む</span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ===== コメントセクション ===== */}
            <Comments slug={slug} />
          </article>

          {/* ===== Sidebar ===== */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
            {/* 目次（デスクトップ固定表示） */}
            {toc.length > 0 && (
              <nav
                className="hidden lg:block rounded-xl p-5"
                aria-label="目次"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
                  目次
                </p>
                <ol className="space-y-2">
                  {toc.map((item, i) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="flex items-start gap-2 text-xs hover:opacity-70 transition-opacity leading-snug"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span className="font-bold shrink-0 mt-0.5" style={{ color: 'var(--accent)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{item.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* カテゴリの人気記事 */}
            <PopularInCategory articles={popularInCategory} category={article.category} />

            {/* カテゴリリンク */}
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: 20, height: 2, backgroundColor: 'var(--accent)' }} />
                <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  このカテゴリ
                </h2>
              </div>
              <Link
                href={`/category/${encodeURIComponent(article.category)}`}
                className="flex items-center justify-between group"
              >
                <span className="text-sm font-bold group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text)' }}>
                  {article.category}
                </span>
                {categoryCount > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    全{categoryCount}件
                  </span>
                )}
              </Link>
            </div>

            {/* タグ一覧 */}
            {article.tags && article.tags.length > 0 && (
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ width: 20, height: 2, backgroundColor: 'var(--accent)' }} />
                  <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    関連タグ
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${encodeURIComponent(tag)}`}
                      className="inline-flex items-center text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
                      style={{
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(200,75,49,0.15)',
                      }}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
