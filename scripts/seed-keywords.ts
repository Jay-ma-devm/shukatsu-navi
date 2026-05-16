// scripts/seed-keywords.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const keywords = [
  { keyword: '自己PR 書き方 例文', category: 'ES・自己PR' },
  { keyword: 'ガクチカ 例文 アルバイト', category: 'ES・自己PR' },
  { keyword: 'ES 通過率 上げる方法', category: 'ES・自己PR' },
  { keyword: '志望動機 書き方 新卒', category: 'ES・自己PR' },
  { keyword: '強み 弱み 就活 例文', category: 'ES・自己PR' },
  { keyword: '面接 逆質問 例文', category: '面接対策' },
  { keyword: 'グループディスカッション コツ 通過', category: '面接対策' },
  { keyword: '面接 自己紹介 1分 例文', category: '面接対策' },
  { keyword: '最終面接 対策 逆転', category: '面接対策' },
  { keyword: 'オンライン面接 注意点', category: '面接対策' },
  { keyword: 'インターン 志望動機 書き方', category: 'インターン' },
  { keyword: 'インターン 服装 夏 私服', category: 'インターン' },
  { keyword: 'インターン メール 例文', category: 'インターン' },
  { keyword: '短期インターン 意味ない 反論', category: 'インターン' },
  { keyword: 'インターン 落ちた 次の行動', category: 'インターン' },
  { keyword: 'マイナビ リクナビ 違い 比較', category: '就活サイト比較' },
  { keyword: '就活サイト おすすめ 2026', category: '就活サイト比較' },
  { keyword: 'キャリアチケット 評判 口コミ', category: '就活サイト比較' },
  { keyword: 'OfferBox 使い方 オファーが来ない', category: '就活サイト比較' },
  { keyword: 'ビズリーチ 学生 登録方法', category: '就活サイト比較' },
]

async function seed() {
  const { error } = await supabase.from('keywords').upsert(keywords, { onConflict: 'keyword' })
  if (error) throw error
  console.log(`${keywords.length}件のキーワードを投入しました`)
}

seed().catch(console.error)
