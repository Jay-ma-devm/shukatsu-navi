import { getCategories } from '@/lib/supabase'

export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'

/**
 * /llms.txt — AI エンジン向けのサイト索引（llms.txt 規格）。
 * 信頼できる主要 URL・カテゴリ・ポリシーを列挙し、AI に正典の入口を示す。
 */
export async function GET(): Promise<Response> {
  const { categories } = await getCategories()

  const categoryLines = categories
    .map(
      ([name, count]) =>
        `- [${name}（${count}件）](${BASE_URL}/category/${encodeURIComponent(name)})`,
    )
    .join('\n')

  const body = `# 就活ナビ

> 28卒向けのES・面接・インターン・業界研究・SPI対策を網羅した就活攻略ガイド。自己分析から内定獲得まで、実例つきで具体的に解説するメディアです。

## 主要ページ
- [トップ（記事一覧）](${BASE_URL}/)
- [このサイトについて](${BASE_URL}/about)
- [お問い合わせ](${BASE_URL}/contact)

## カテゴリ
${categoryLines}

## ポリシー
- [プライバシーポリシー](${BASE_URL}/privacy)

## フィード
- [新着記事 RSS](${BASE_URL}/feed.xml)
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
