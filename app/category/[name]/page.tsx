import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticles, getCategories, getTotalCount } from '@/lib/supabase'
import { ArticleCard } from '@/components/ArticleCard'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Pagination } from '@/components/Pagination'
import type { Metadata } from 'next'

export const revalidate = 1800

const PER_PAGE = 15
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'

/** JSON-LD を XSS-safe にシリアライズする（< を unicode エスケープ） */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

export async function generateStaticParams() {
  const { categories } = await getCategories()
  return categories.map(([name]) => ({ name: encodeURIComponent(name) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const category = decodeURIComponent(name)
  return {
    title: `${category}の記事一覧`,
    description: `${category}に関する就活攻略記事の一覧です。`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { name } = await params
  const { page: pageParam } = await searchParams
  const category = decodeURIComponent(name)
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))

  const [articles, totalCount] = await Promise.all([
    getArticles(PER_PAGE, (currentPage - 1) * PER_PAGE, category),
    getTotalCount(category),
  ])

  if (totalCount === 0 && currentPage === 1) {
    notFound()
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)
  const basePath = `/category/${encodeURIComponent(category)}`

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category}の記事一覧`,
    description: `${category}に関する就活攻略記事の一覧です。`,
    url: `${BASE_URL}/category/${encodeURIComponent(category)}`,
    numberOfItems: totalCount,
    hasPart: articles.map((article) => ({
      '@type': 'Article',
      headline: article.title,
      description: article.meta_desc,
      url: `${BASE_URL}/articles/${article.slug}`,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '就活ナビ', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `${BASE_URL}/category/${encodeURIComponent(category)}`,
      },
    ],
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      {/* JSON-LD 構造化データ（XSS対策済み） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <SiteHeader />

      {/* ===== Category Hero ===== */}
      <div style={{ backgroundColor: 'var(--dark-mid)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-4" style={{ color: '#9CA3AF' }}>
            <Link href="/" className="hover:text-white transition-colors">就活ナビ</Link>
            <span>/</span>
            <span style={{ color: 'var(--accent)' }}>{category}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            {category}
          </h1>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            全{totalCount}件の記事
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ===== Article Count ===== */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--text)' }}>{totalCount}件</span>の記事
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentPage} / {totalPages} ページ
          </p>
        </div>

        {/* ===== Article Grid ===== */}
        {articles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>記事が見つかりませんでした</p>
          </div>
        )}

        {/* ===== Pagination ===== */}
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />

        {/* ===== Back Link ===== */}
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-70 transition-opacity"
            style={{ color: 'var(--accent)' }}
          >
            ← 記事一覧へ戻る
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
