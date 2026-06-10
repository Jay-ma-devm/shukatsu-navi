// app/api/comments/route.ts — コメント投稿・取得API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 簡易NGワード（必要に応じて拡張）
const NG_WORDS = ['http://', 'https://', '死ね', '殺す']

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .select('id, nickname, content, created_at')
    .eq('article_slug', slug)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 各コメントのいいね数とビジターのいいね済みフラグを取得
  const store = await cookies()
  const visitorId = store.get('visitor_id')?.value ?? ''
  const ids = (data ?? []).map(c => c.id)

  const [likesByComment, likedByVisitor] = ids.length > 0
    ? await Promise.all([
        supabase.from('comment_likes').select('comment_id').in('comment_id', ids),
        visitorId
          ? supabase.from('comment_likes').select('comment_id').in('comment_id', ids).eq('visitor_id', visitorId)
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }]

  const counts: Record<string, number> = {}
  for (const row of likesByComment.data ?? []) counts[row.comment_id] = (counts[row.comment_id] ?? 0) + 1
  const liked = new Set((likedByVisitor.data ?? []).map(r => r.comment_id))

  const enriched = (data ?? []).map(c => ({
    ...c,
    likes: counts[c.id] ?? 0,
    liked: liked.has(c.id),
  }))
  return NextResponse.json({ comments: enriched })
}

export async function POST(req: NextRequest) {
  const { slug, nickname, content } = await req.json()

  if (!slug || !nickname || !content) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }
  if (nickname.length > 30) return NextResponse.json({ error: 'ニックネームは30文字以内' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'コメントは1000文字以内' }, { status: 400 })
  if (content.length < 3) return NextResponse.json({ error: 'コメントは3文字以上' }, { status: 400 })

  // NGワードチェック
  const lower = content.toLowerCase()
  if (NG_WORDS.some(w => lower.includes(w))) {
    return NextResponse.json({ error: 'URL・不適切な内容は投稿できません' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ article_slug: slug, nickname: nickname.slice(0, 30), content: content.slice(0, 1000) })
    .select('id, nickname, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
