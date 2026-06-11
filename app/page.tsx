import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticles, getCategories, getTotalCount, getTopArticlesByCategories } from '@/lib/supabase'
import { ArticleSearch } from '@/components/ArticleSearch'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Pagination } from '@/components/Pagination'

export const revalidate = 1800

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const PER_PAGE = 20

// カテゴリ統合定義（一箇所だけで管理）
type CategoryMeta = { name: string; icon: string; desc: string; color: string }
const ALL_CATEGORIES: CategoryMeta[] = [
  { name: 'ES・自己PR',     icon: '✍️', desc: 'ガクチカ・自己PR・志望動機の書き方',     color: '#C84B31' },
  { name: '面接対策',       icon: '🎤', desc: '頻出質問・逆質問・グループ面接の対策',     color: '#0D6EFD' },
  { name: 'インターン',     icon: '💼', desc: '選考突破から参加後の活かし方まで',         color: '#198754' },
  { name: '業界研究',       icon: '🔍', desc: '業界別の傾向と志望理由の組み立て方',       color: '#6F42C1' },
  { name: '企業研究',       icon: '🏢', desc: '企業選び・OpenWork等の活用法',             color: '#FD7E14' },
  { name: 'OB・OG訪問',    icon: '🤝', desc: 'アポ取りから質問例まで完全ガイド',         color: '#20C997' },
  { name: 'SPI・筆記試験',  icon: '📝', desc: 'SPI・玉手箱・テストセンター攻略',          color: '#0DCAF0' },
  { name: '就活マナー',     icon: '👔', desc: 'メール・電話・服装・お辞儀の正解',         color: '#6610F2' },
  { name: '就活サイト比較', icon: '⚖️', desc: 'マイナビ・リクナビ・OfferBoxの違い',        color: '#D63384' },
  { name: '就活スケジュール', icon: '📅', desc: '28卒向けタイムライン・準備の進め方',     color: '#0D1B2A' },
  { name: 'キャリア設計',   icon: '🌟', desc: '将来設計・キャリアプランの考え方',         color: '#E83E8C' },
  { name: '留学・海外就活', icon: '✈️', desc: '海外就職・グローバル就活の準備',           color: '#0DA678' },
]

const FEATURED_CATEGORIES = ['ES・自己PR','面接対策','インターン','OB・OG訪問','業界研究','SPI・筆記試験']

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { page: pageParam, category: categoryParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const activeCategory = categoryParam ?? ''

  const [articles, { categories, tags }, totalCount, featuredArticles] = await Promise.all([
    getArticles(PER_PAGE, (currentPage - 1) * PER_PAGE, activeCategory || undefined),
    getCategories(),
    getTotalCount(activeCategory || undefined),
    getTopArticlesByCategories(FEATURED_CATEGORIES),
  ])

  const totalPages = Math.ceil(totalCount / PER_PAGE)
  const basePath = activeCategory
    ? `/?category=${encodeURIComponent(activeCategory)}`
    : '/'
  const categoryCountMap = new Map(categories.map(([c, n]) => [c, n]))

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '就活ナビ',
    url: SITE_URL,
    description: '28卒向けES・面接・インターン・業界研究の完全攻略ガイド。',
    inLanguage: 'ja',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      {/* ホームの WebSite + SearchAction 構造化データ（XSS対策: < を unicode エスケープ） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader />

      {/* ===== Hero ===== */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--dark) 0%, var(--dark-mid) 60%, #1e3a5f 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              28卒 就活完全攻略
            </span>
            <h1
              className="text-3xl md:text-5xl font-black text-white leading-tight mb-5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              就活を制する者が<br />
              <span style={{ color: 'var(--accent)' }}>内定</span>を制する
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
              ES・自己PR・面接・インターンまで、内定獲得の全ステップを徹底ナビゲート。
              <br className="hidden md:block" />
              全<span className="font-bold text-white">{totalCount}</span>記事が無料でご覧いただけます。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/category/ES・自己PR"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                ✍️ ES対策を始める
              </Link>
              <Link
                href="/category/面接対策"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:bg-white/20"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                🎤 面接対策を見る
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 統合カテゴリグリッド（メインのカテゴリナビ） ===== */}
      <section style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-end justify-between mb-7">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ width: 28, height: 2, backgroundColor: 'var(--accent)' }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                  Categories
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                テーマから記事を探す
              </h2>
            </div>
            <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
              全{totalCount}記事を12カテゴリで分類
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ALL_CATEGORIES.map((cat) => {
              const count = categoryCountMap.get(cat.name) ?? 0
              return (
                <Link
                  key={cat.name}
                  href={`/category/${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    minHeight: 130,
                  }}
                >
                  {/* 左カラーバー */}
                  <div
                    className="absolute left-0 top-0 bottom-0"
                    style={{ width: 4, backgroundColor: cat.color }}
                  />
                  <div className="p-4 pl-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                      >
                        {count}
                      </span>
                    </div>
                    <p
                      className="text-sm font-bold mb-1 leading-tight group-hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}
                    >
                      {cat.name}
                    </p>
                    <p className="text-xs leading-snug mt-auto" style={{ color: 'var(--text-muted)' }}>
                      {cat.desc}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== カテゴリ別特集 ===== */}
      {featuredArticles.length > 0 && (
        <section style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-end justify-between mb-7">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ width: 28, height: 2, backgroundColor: 'var(--accent)' }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                    Featured
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  カテゴリ別ピックアップ
                </h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="group flex flex-col rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="px-5 pt-5 pb-4 flex-1">
                    <span
                      className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    >
                      {article.category}
                    </span>
                    <p
                      className="text-sm font-bold leading-snug group-hover:opacity-60 transition-opacity line-clamp-2"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}
                    >
                      {article.title}
                    </p>
                    {article.meta_desc && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {article.meta_desc}
                      </p>
                    )}
                  </div>
                  <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                      続きを読む →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 記事一覧 ===== */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-7">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ width: 28, height: 2, backgroundColor: 'var(--accent)' }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
                    {activeCategory ? activeCategory : 'All Articles'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  {activeCategory ? `${activeCategory}の記事` : '新着記事'}
                </h2>
              </div>
              {activeCategory && (
                <Link
                  href="/"
                  className="text-xs font-bold hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ← すべて表示
                </Link>
              )}
            </div>

            {/* 検索 + 記事グリッド */}
            <ArticleSearch articles={articles} totalCount={totalCount} />

            {!activeCategory && (
              <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
            )}
          </div>

          {/* サイドバー（カテゴリ重複は削除） */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            {/* 人気タグ */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-5" style={{ color: 'var(--text-muted)' }}>
                # 人気タグ
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map(([tag, count]) => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
                    style={{
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(200,75,49,0.15)',
                    }}
                  >
                    #{tag}
                    <span className="opacity-60">{count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTAバナー */}
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, var(--dark) 0%, var(--dark-mid) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-lg font-black text-white mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                内定まで<br />全力でサポート
              </p>
              <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
                全{totalCount}記事無料・28卒最新情報を随時更新
              </p>
              <Link
                href="/category/ES・自己PR"
                className="inline-block w-full py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 text-center"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                記事を読む →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
