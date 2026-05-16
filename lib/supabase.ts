// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export type Article = {
  id: string
  slug: string
  title: string
  content: string
  meta_desc: string
  keyword: string
  category: string
  published: boolean
  created_at: string
}

export type Keyword = {
  id: string
  keyword: string
  category: string
  used: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function isConfigured(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const supabase = isConfigured(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>)

export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!isConfigured(supabaseUrl) || !serviceKey) {
    throw new Error('Supabase admin is not configured')
  }
  return createClient(supabaseUrl, serviceKey)
}

export async function getArticles(limit = 10): Promise<Article[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  if (error) return null
  return data
}

export async function getAllSlugs(): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('published', true)
  if (error) return []
  return (data ?? []).map((r) => r.slug)
}

export async function getUnusedKeyword(): Promise<Keyword | null> {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('keywords')
    .select('*')
    .eq('used', false)
    .limit(1)
    .single()
  if (error) return null
  return data
}

export async function saveArticle(article: Omit<Article, 'id' | 'created_at'>): Promise<void> {
  const admin = supabaseAdmin()
  const { error } = await admin.from('articles').insert(article)
  if (error) throw error
}

export async function markKeywordUsed(id: string): Promise<void> {
  const admin = supabaseAdmin()
  const { error } = await admin.from('keywords').update({ used: true }).eq('id', id)
  if (error) throw error
}
