// scripts/bulk-insert-mensetsu.ts — 面接対策記事を投入
import { createClient } from '@supabase/supabase-js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DIR = join(process.cwd(), 'tmp-batches')

async function main() {
  // 面接対策・業界研究・留学・就活スケジュール・就活マナー・就活サイト比較を全部処理
  const files = readdirSync(DIR).filter(f => {
    if (!f.endsWith('.json')) return false
    return f.startsWith('articles_mensetsu_')
        || f.startsWith('articles_業界研究_')
        || f.startsWith('articles_留学・海外就活_')
        || f.startsWith('articles_就活スケジュール_')
        || f.startsWith('articles_就活マナー_')
        || f.startsWith('articles_就活サイト比較_')
  }).sort()
  if (files.length === 0) { console.log('articles_mensetsu_*.json なし'); return }

  let inserted = 0, skipped = 0, errors = 0
  for (const file of files) {
    const articles = JSON.parse(readFileSync(join(DIR, file), 'utf-8'))
    console.log(`📄 ${file}: ${articles.length}件`)
    for (const a of articles) {
      try {
        const row = {
          title: a.title,
          slug: String(a.article_no ?? a.slug),
          keyword: a.keyword,
          category: a.category,
          content: a.content,
          meta_desc: a.meta_desc,
          tags: Array.isArray(a.tags) ? a.tags : [],
          published: true,
        }
        const { error } = await sb.from('articles').insert(row)
        if (error?.code === '23505') { skipped++; continue }
        if (error) throw error
        if (a.keyword_id) await sb.from('keywords').update({ used: true }).eq('id', a.keyword_id)
        inserted++
      } catch (e) {
        errors++
        const msg = e instanceof Error ? e.message.slice(0, 60) : String(e)
        console.error(`❌ [${a.keyword}] ${msg}`)
      }
    }
  }
  const { count } = await sb.from('articles').select('*', { count: 'exact', head: true })
  console.log(`\n🎉 投入${inserted} / スキップ${skipped} / エラー${errors}`)
  console.log(`📊 DB総記事数: ${count}件`)
}

main().catch(e => { console.error(e); process.exit(1) })
