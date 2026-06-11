import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Article = {
  id: string
  slug: string
  title: string
  content: string
  meta_desc: string
  keyword: string
  category: string
  tags: string[]
  published: boolean
  created_at: string
}

export async function getArticles(limit = 20, offset = 0, category?: string) {
  let q = supabase.from('articles').select('*').eq('published', true).order('slug', { ascending: true })
  if (category) q = q.eq('category', category)
  const { data } = await q.range(offset, offset + limit - 1)
  return data as Article[] ?? []
}

export async function getArticleBySlug(slug: string) {
  const { data } = await supabase.from('articles').select('*').eq('slug', slug).single()
  return data as Article | null
}

/** 新着順（created_at 降順）の記事を返す。RSS フィード用。 */
export async function getRecentArticles(limit = 30) {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, category, meta_desc, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as Pick<Article, 'slug' | 'title' | 'category' | 'meta_desc' | 'created_at'>[]) ?? []
}

export async function getAllSlugs() {
  const { data } = await supabase.from('articles').select('slug').eq('published', true).order('slug', { ascending: true })
  return data?.map(d => d.slug) ?? []
}

export async function getCategories() {
  const { data } = await supabase.from('articles').select('category, tags').eq('published', true)
  const cats = new Map<string, number>()
  const tags = new Map<string, number>()
  for (const a of data ?? []) {
    cats.set(a.category, (cats.get(a.category) ?? 0) + 1)
    for (const t of (a.tags ?? [])) tags.set(t, (tags.get(t) ?? 0) + 1)
  }
  return {
    categories: [...cats.entries()].sort((a,b) => b[1]-a[1]),
    tags: [...tags.entries()].sort((a,b) => b[1]-a[1]).slice(0, 30),
  }
}

export async function getRelatedArticles(category: string, tags: string[], currentSlug: string, limit = 4) {
  // 同カテゴリの記事をまとめて取得（limit より多めに）
  const { data: sameCategory } = await supabase
    .from('articles')
    .select('slug, title, category, tags, meta_desc')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(limit * 3)

  if (!sameCategory || sameCategory.length === 0) {
    // カテゴリ記事がない場合は最新記事で補完
    const { data: latest } = await supabase
      .from('articles')
      .select('slug, title, category, meta_desc')
      .eq('published', true)
      .neq('slug', currentSlug)
      .order('created_at', { ascending: false })
      .limit(limit)
    return latest ?? []
  }

  // タグ一致スコアでソート（一致タグ数が多いほど上位）
  const scored = sameCategory.map((article) => {
    const articleTags: string[] = article.tags ?? []
    const matchCount = tags.filter((t) => articleTags.includes(t)).length
    return { ...article, _score: matchCount }
  })
  scored.sort((a, b) => b._score - a._score)

  const result = scored.slice(0, limit)

  // limit に満たない場合は最新記事で補完
  if (result.length < limit) {
    const existingSlugs = result.map((a) => a.slug)
    const { data: latest } = await supabase
      .from('articles')
      .select('slug, title, category, meta_desc')
      .eq('published', true)
      .neq('slug', currentSlug)
      .not('slug', 'in', `(${existingSlugs.map((s) => `"${s}"`).join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit - result.length)
    for (const a of latest ?? []) result.push(a as typeof result[0])
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return result.map(({ _score, ...rest }) => rest)
}

export async function getPopularInCategory(category: string, currentSlug: string, limit = 5) {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, category')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getTopArticlesByCategories(categories: string[]) {
  // 各カテゴリから最新1件を並列取得
  const results = await Promise.all(
    categories.map(async (cat) => {
      const { data } = await supabase
        .from('articles')
        .select('slug, title, category, meta_desc, tags')
        .eq('published', true)
        .eq('category', cat)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      return data ? { ...data, category: cat } : null
    })
  )
  return results.filter(Boolean) as Array<{ slug: string; title: string; category: string; meta_desc: string; tags: string[] }>
}

export async function getTotalCount(category?: string) {
  let q = supabase.from('articles').select('*', { count: 'exact', head: true }).eq('published', true)
  if (category) q = q.eq('category', category)
  const { count } = await q
  return count ?? 0
}

export async function getUnusedKeyword() {
  const { data } = await supabase.from('keywords').select('*').eq('used', false).limit(1).single()
  return data as { id: string; keyword: string; category: string } | null
}

export async function saveArticle(article: Omit<Article, 'id' | 'created_at'> & { published: boolean }) {
  const { data, error } = await supabase.from('articles').insert(article).select().single()
  if (error) throw error
  return data as Article
}

export async function markKeywordUsed(id: string) {
  await supabase.from('keywords').update({ used: true }).eq('id', id)
}

export async function getArticlesByTag(tag: string, limit = 20, offset = 0) {
  const { data } = await supabase.from('articles').select('*')
    .eq('published', true)
    .contains('tags', [tag])
    .order('slug', { ascending: true })
    .range(offset, offset + limit - 1)
  return data as Article[] ?? []
}

export async function getTotalCountByTag(tag: string) {
  const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true })
    .eq('published', true)
    .contains('tags', [tag])
  return count ?? 0
}
