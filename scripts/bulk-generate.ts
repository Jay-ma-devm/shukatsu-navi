// scripts/bulk-generate.ts
// 1000記事バルク生成スクリプト
// レート制限: 10 req/min（Gemini 2.5 Flash フリー枠）
// 並列度: 3

import { createClient } from '@supabase/supabase-js'
import { generateArticle } from '../lib/gemini'
import { injectAffiliateLinks } from '../lib/affiliate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CONCURRENCY = 3
const MIN_INTERVAL_MS = 7000  // 7秒間隔 = ~8.5 req/min（安全マージン込み）
const TARGET_COUNT = 1000
const BATCH_SIZE = 50

// シンプルなレートリミッター
class RateLimiter {
  private queue: (() => void)[] = []
  private running = 0
  private lastRequestTime = 0

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this.process()
    })
  }

  private async process() {
    if (this.running >= CONCURRENCY) return
    const next = this.queue.shift()
    if (!next) return

    this.running++
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    const wait = Math.max(0, MIN_INTERVAL_MS - elapsed)

    if (wait > 0) await sleep(wait)
    this.lastRequestTime = Date.now()
    next()
  }

  release() {
    this.running--
    this.process()
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function getUnusedKeywords(limit: number) {
  const { data, error } = await supabase
    .from('keywords')
    .select('*')
    .eq('used', false)
    .limit(limit)
  if (error) throw error
  return data ?? []
}

async function countArticles() {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function saveAndMarkUsed(article: Awaited<ReturnType<typeof generateArticle>>, keywordId: string) {
  const { error: insertError } = await supabase
    .from('articles')
    .insert({ ...article, published: true })
  if (insertError) throw insertError

  const { error: updateError } = await supabase
    .from('keywords')
    .update({ used: true })
    .eq('id', keywordId)
  if (updateError) throw updateError
}

async function processKeyword(
  kw: { id: string; keyword: string; category: string },
  limiter: RateLimiter,
  stats: { success: number; error: number; total: number }
) {
  await limiter.acquire()
  try {
    const article = await generateArticle(kw.keyword, kw.category)
    article.content = injectAffiliateLinks(article.content)
    await saveAndMarkUsed(article, kw.id)
    stats.success++
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const rate = stats.success / (elapsed / 60)
    const eta = Math.round((stats.total - stats.success - stats.error) / (rate || 1))
    process.stdout.write(
      `\r✅ ${stats.success}/${stats.total} 生成完了 | エラー: ${stats.error} | 速度: ${rate.toFixed(1)}件/分 | 残り: ~${eta}分  `
    )
  } catch (err) {
    stats.error++
    const errMsg = err instanceof Error ? err.message.slice(0, 80) : String(err)
    console.error(`\n❌ [${kw.keyword}] ${errMsg}`)
    // 429エラーならバックオフ
    if (errMsg.includes('429')) await sleep(30000)
  } finally {
    limiter.release()
  }
}

const startTime = Date.now()

async function main() {
  const currentCount = await countArticles()
  console.log(`\n🚀 就活ナビ バルク記事生成開始`)
  console.log(`📊 現在の記事数: ${currentCount}件`)
  console.log(`🎯 目標: ${TARGET_COUNT}件`)
  console.log(`⚙️  並列度: ${CONCURRENCY} | レート: ~${Math.round(60000/MIN_INTERVAL_MS)}req/min\n`)

  const needed = TARGET_COUNT - currentCount
  if (needed <= 0) {
    console.log('✨ すでに目標達成済みです！')
    return
  }

  let totalGenerated = 0
  const limiter = new RateLimiter()

  while (totalGenerated < needed) {
    const remaining = needed - totalGenerated
    const fetchCount = Math.min(remaining + 10, BATCH_SIZE) // 少し余分に取得
    const keywords = await getUnusedKeywords(fetchCount)

    if (keywords.length === 0) {
      console.log('\n⚠️ 未使用キーワードがなくなりました')
      break
    }

    const batch = keywords.slice(0, Math.min(remaining, keywords.length))
    const stats = { success: 0, error: 0, total: batch.length }

    console.log(`\n📦 バッチ処理: ${batch.length}件のキーワードを処理します`)

    const promises = batch.map(kw => processKeyword(kw, limiter, stats))
    await Promise.all(promises)

    totalGenerated += stats.success
    console.log(`\n✅ バッチ完了: ${stats.success}件成功 / ${stats.error}件失敗`)
  }

  const finalCount = await countArticles()
  const elapsed = Math.round((Date.now() - startTime) / 1000 / 60)
  console.log(`\n🎉 完了！`)
  console.log(`📰 総記事数: ${finalCount}件`)
  console.log(`⏱  所要時間: ${elapsed}分`)
}

main().catch(e => {
  console.error('\n❌ 致命的エラー:', e)
  process.exit(1)
})
