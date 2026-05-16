// scripts/bulk-generate.ts
// 就活ナビ 1000記事バルク生成スクリプト
// レート: 8 req/min（Gemini 2.5 Flash フリー枠 10 RPMの安全圏）

import { createClient } from '@supabase/supabase-js'
import { generateArticle } from '../lib/gemini'
import { injectAffiliateLinks } from '../lib/affiliate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TARGET_COUNT = 1000
const API_INTERVAL_MS = 8000   // 8秒間隔 = 7.5 req/min（安全マージン込み）
const FETCH_BATCH = 100        // 一度に取得するキーワード数

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function getUnusedKeywords(limit: number) {
  const { data, error } = await supabase
    .from('keywords').select('*').eq('used', false).limit(limit)
  if (error) throw error
  return data ?? []
}

async function countArticles() {
  const { count, error } = await supabase
    .from('articles').select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function saveAndMark(
  article: Awaited<ReturnType<typeof generateArticle>>,
  keywordId: string
) {
  const { error: e1 } = await supabase.from('articles').insert({ ...article, published: true })
  if (e1) throw e1
  const { error: e2 } = await supabase.from('keywords').update({ used: true }).eq('id', keywordId)
  if (e2) throw e2
}

const startTime = Date.now()

async function main() {
  const initial = await countArticles()
  console.log(`\n🚀 就活ナビ バルク記事生成開始`)
  console.log(`📊 現在の記事数: ${initial}件 → 目標: ${TARGET_COUNT}件`)
  console.log(`⚙️  レート: ${Math.round(60000/API_INTERVAL_MS)} req/min（順次処理）\n`)

  let totalSuccess = 0
  let totalError = 0

  while (true) {
    const currentCount = await countArticles()
    if (currentCount >= TARGET_COUNT) {
      console.log(`\n🎉 目標達成！総記事数: ${currentCount}件`)
      break
    }

    const keywords = await getUnusedKeywords(FETCH_BATCH)
    if (keywords.length === 0) {
      console.log('\n⚠️  未使用キーワードがなくなりました')
      break
    }

    for (let i = 0; i < keywords.length; i++) {
      const current = await countArticles()
      if (current >= TARGET_COUNT) break

      const kw = keywords[i]
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const rate = totalSuccess / (elapsed / 60) || 0
      const remaining = TARGET_COUNT - current
      const eta = rate > 0 ? Math.round(remaining / rate) : '?'

      process.stdout.write(
        `\r📝 記事${current}件 | ✅${totalSuccess} ❌${totalError} | ${rate.toFixed(1)}件/分 | 残り~${eta}分 | ${kw.keyword.slice(0,20)}...  `
      )

      try {
        const article = await generateArticle(kw.keyword, kw.category)
        article.content = injectAffiliateLinks(article.content)
        await saveAndMark(article, kw.id)
        totalSuccess++
      } catch (err) {
        totalError++
        const msg = err instanceof Error ? err.message.slice(0, 120) : String(err)
        console.error(`\n❌ [${kw.keyword}] ${msg}`)

        // 429 なら 60秒待ってリトライしない（次のキーワードへ）
        if (msg.includes('429')) {
          console.log('⏳ レート制限: 60秒待機...')
          await sleep(60000)
        }
      }

      // 次のリクエストまで待機
      if (i < keywords.length - 1) await sleep(API_INTERVAL_MS)
    }
  }

  const finalCount = await countArticles()
  const elapsed = Math.round((Date.now() - startTime) / 1000 / 60)
  console.log(`\n\n📰 最終記事数: ${finalCount}件`)
  console.log(`✅ 成功: ${totalSuccess} | ❌ 失敗: ${totalError}`)
  console.log(`⏱  所要時間: ${elapsed}分`)
}

main().catch(e => { console.error('\n❌ 致命的エラー:', e); process.exit(1) })
