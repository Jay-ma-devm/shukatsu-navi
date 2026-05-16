// app/articles/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { getArticleBySlug, getAllSlugs } from '@/lib/supabase'
import { AffiliateBlock } from '@/components/AffiliateBlock'
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
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
          {article.category}
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <time className="text-gray-400 text-sm">
        {new Date(article.created_at).toLocaleDateString('ja-JP')}
      </time>

      <div className="my-6 bg-gray-100 h-16 flex items-center justify-center text-gray-400 text-sm rounded">
        広告スペース（AdSense）
      </div>

      <div
        className="prose prose-lg max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(article.content) as string) }}
      />

      <AffiliateBlock />
    </main>
  )
}
