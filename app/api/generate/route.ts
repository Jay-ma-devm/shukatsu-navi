import { NextRequest, NextResponse } from 'next/server'
import { generateArticle } from '@/lib/gemini'
import { injectAffiliateLinks } from '@/lib/affiliate'
import { getUnusedKeyword, saveArticle, markKeywordUsed } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const secret = process.env.CRON_SECRET
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const keyword = await getUnusedKeyword()
    if (!keyword) {
      return NextResponse.json({ message: 'No unused keywords' }, { status: 200 })
    }

    const article = await generateArticle(keyword.keyword, keyword.category)
    article.content = injectAffiliateLinks(article.content)

    await saveArticle({ ...article, published: true })
    await markKeywordUsed(keyword.id)

    return NextResponse.json({ message: 'Article generated', slug: article.slug })
  } catch (err) {
    console.error('Article generation failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
