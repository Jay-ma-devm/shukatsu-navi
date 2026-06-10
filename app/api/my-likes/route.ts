// app/api/my-likes/route.ts — Cookieのvisitor_idでいいね済み記事を取得
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const store = await cookies()
  const visitorId = store.get('visitor_id')?.value
  if (!visitorId) return NextResponse.json({ articles: [] })

  const { data: likes } = await supabase
    .from('article_likes')
    .select('article_slug, created_at')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(100)

  const slugs = (likes ?? []).map(l => l.article_slug)
  if (slugs.length === 0) return NextResponse.json({ articles: [] })

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, category, meta_desc, created_at, tags, content')
    .in('slug', slugs)
    .eq('published', true)

  // いいね順に並び替え
  const sortMap = new Map(slugs.map((s, i) => [s, i]))
  const sorted = (articles ?? []).sort((a, b) => (sortMap.get(a.slug) ?? 0) - (sortMap.get(b.slug) ?? 0))
  return NextResponse.json({ articles: sorted })
}
