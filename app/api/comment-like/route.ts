// app/api/comment-like/route.ts
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
  if (!id) id = crypto.randomUUID()
  return id
}

export async function POST(req: NextRequest) {
  const { commentId } = await req.json()
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })

  const visitorId = await getVisitorId()
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  let liked: boolean
  if (existing) {
    await supabase.from('comment_likes').delete().eq('id', existing.id)
    liked = false
  } else {
    await supabase.from('comment_likes').insert({ comment_id: commentId, visitor_id: visitorId })
    liked = true
  }
  const { count } = await supabase.from('comment_likes').select('*', { count: 'exact', head: true }).eq('comment_id', commentId)

  const res = NextResponse.json({ liked, count: count ?? 0 })
  res.cookies.set('visitor_id', visitorId, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/',
  })
  return res
}
