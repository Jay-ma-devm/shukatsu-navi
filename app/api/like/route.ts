// app/api/like/route.ts — いいね API（匿名・visitor_idで重複防止）
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getVisitorId() {
  const store = await cookies()
  let id = store.get('visitor_id')?.value
  if (!id) {
    id = crypto.randomUUID()
  }
  return id
}

export async function POST(req: NextRequest) {
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const visitorId = await getVisitorId()

  // 既にいいね済みか確認
  const { data: existing } = await supabase
    .from('article_likes')
    .select('id')
    .eq('article_slug', slug)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (existing) {
    // 解除
    await supabase.from('article_likes').delete().eq('id', existing.id)
    const { count } = await supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_slug', slug)
    return NextResponse.json({ liked: false, count: count ?? 0 })
  }

  // 追加
  const { error } = await supabase.from('article_likes').insert({ article_slug: slug, visitor_id: visitorId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_slug', slug)

  // visitor_id cookieをセット
  const res = NextResponse.json({ liked: true, count: count ?? 0 })
  res.cookies.set('visitor_id', visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const visitorId = await getVisitorId()

  const [{ count }, { data: existing }] = await Promise.all([
    supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('article_slug', slug),
    supabase.from('article_likes').select('id').eq('article_slug', slug).eq('visitor_id', visitorId).maybeSingle(),
  ])

  return NextResponse.json({ liked: !!existing, count: count ?? 0 })
}
