import { getRecentArticles } from '@/lib/supabase'

export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'
const FEED_LIMIT = 30

/** XML 特殊文字をエスケープする */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * /feed.xml — 新着記事の RSS 2.0 フィード。
 * AI エンジン・RSS リーダーが新着コンテンツを発見・追跡するための経路。
 */
export async function GET(): Promise<Response> {
  const articles = await getRecentArticles(FEED_LIMIT)
  const lastBuild = new Date().toUTCString()

  const items = articles
    .map((a) => {
      const url = `${BASE_URL}/articles/${a.slug}`
      const pubDate = new Date(a.created_at).toUTCString()
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.meta_desc ?? '')}</description>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>就活ナビ｜28卒就活完全攻略ガイド</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>28卒向けES・面接・インターン・業界研究の就活攻略ガイドの新着記事</description>
    <language>ja</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
