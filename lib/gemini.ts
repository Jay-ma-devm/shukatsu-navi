// lib/gemini.ts
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export type ArticleData = {
  title: string
  content: string
  meta_desc: string
  slug: string
  keyword: string
  category: string
  tags: string[]
}

// カテゴリ別の外部リンク定義
const EXTERNAL_LINKS: Record<string, Array<{ name: string; url: string; desc: string }>> = {
  'ES・自己PR': [
    { name: 'マイナビ就活', url: 'https://job.mynavi.jp', desc: 'ES例文・添削サービス' },
    { name: '就活会議', url: 'https://syukatsu-kaigi.jp', desc: 'ES通過実績データ' },
    { name: 'ワンキャリア', url: 'https://one-career.jp', desc: '内定者ESデータベース' },
  ],
  '面接対策': [
    { name: 'マイナビ就活', url: 'https://job.mynavi.jp', desc: '面接対策コンテンツ' },
    { name: '就活会議', url: 'https://syukatsu-kaigi.jp', desc: '面接体験談データベース' },
    { name: 'リクナビ', url: 'https://job.rikunabi.com', desc: '面接練習・模擬面接' },
  ],
  'インターン': [
    { name: 'マイナビインターン', url: 'https://internship.mynavi.jp', desc: 'インターン情報検索' },
    { name: 'ワンキャリア', url: 'https://one-career.jp', desc: 'インターン選考情報' },
    { name: 'キャリアパーク', url: 'https://careerpark.jp', desc: 'インターン体験談' },
  ],
  '就活サイト比較': [
    { name: 'マイナビ就活', url: 'https://job.mynavi.jp', desc: '業界最大手の就活サイト' },
    { name: 'リクナビ', url: 'https://job.rikunabi.com', desc: '大手就活プラットフォーム' },
    { name: 'OfferBox', url: 'https://offerbox.jp', desc: 'オファー型就活サービス' },
  ],
  'SPI・筆記試験': [
    { name: 'SPI3対策問題集', url: 'https://job.mynavi.jp/conts/spi', desc: 'SPI公式対策' },
    { name: 'リクナビ適性検査', url: 'https://job.rikunabi.com', desc: '模擬テスト' },
  ],
  '就活マナー': [
    { name: 'マイナビ就活マナー', url: 'https://job.mynavi.jp/conts/manner', desc: '就活マナー完全ガイド' },
    { name: '厚生労働省', url: 'https://www.mhlw.go.jp', desc: '労働関連法規・情報' },
  ],
  '業界研究': [
    { name: '業界地図', url: 'https://job.mynavi.jp/conts/industry', desc: '業界研究データ' },
    { name: 'OpenWork', url: 'https://www.openwork.jp', desc: '口コミ・年収データ' },
    { name: '就職四季報', url: 'https://str.toyokeizai.net', desc: '企業データ公式版' },
  ],
  '企業研究': [
    { name: 'OpenWork', url: 'https://www.openwork.jp', desc: '社員口コミ・評価' },
    { name: '四季報オンライン', url: 'https://shikiho.toyokeizai.net', desc: '財務・業績データ' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com', desc: '企業情報・社員データ' },
  ],
  'OB・OG訪問': [
    { name: 'Matcher', url: 'https://matcher.jp', desc: 'OB・OG訪問マッチング' },
    { name: 'ビズリーチ・キャンパス', url: 'https://br-campus.jp', desc: 'OB訪問プラットフォーム' },
  ],
  '就活スケジュール': [
    { name: 'マイナビ就活スケジュール', url: 'https://job.mynavi.jp/conts/schedule', desc: '就活スケジュール一覧' },
    { name: '経団連', url: 'https://www.keidanren.or.jp', desc: '採用ルール・スケジュール公式' },
  ],
  'キャリア設計': [
    { name: 'リクナビNEXT', url: 'https://next.rikunabi.com', desc: 'キャリアプランニング' },
    { name: 'マイナビ転職', url: 'https://tenshoku.mynavi.jp', desc: 'キャリアアップ情報' },
  ],
  '留学・海外就活': [
    { name: 'GaiaX就活', url: 'https://gaiax.jp', desc: '海外就活情報' },
    { name: 'JICA', url: 'https://www.jica.go.jp', desc: '国際協力・海外勤務' },
  ],
}

// Unsplash画像URL（カテゴリ別）
const CATEGORY_IMAGES: Record<string, string[]> = {
  'ES・自己PR': [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
  ],
  '面接対策': [
    'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  ],
  'インターン': [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
  ],
  '就活サイト比較': [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  ],
  'default': [
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
  ],
}

function getImageUrl(category: string, index: number = 0): string {
  const images = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES['default']
  return images[index % images.length]
}

function getExternalLinks(category: string) {
  return EXTERNAL_LINKS[category] ?? EXTERNAL_LINKS['業界研究']
}

function toSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    + '-' + Date.now()
}

export async function generateArticle(keyword: string, category: string): Promise<ArticleData> {
  const externalLinks = getExternalLinks(category)
  const imageUrl = getImageUrl(category)
  const imageUrl2 = getImageUrl(category, 1)

  const linksText = externalLinks.map(l => `- [${l.name}](${l.url}): ${l.desc}`).join('\n')

  const prompt = `あなたはSEOに精通した就活ライターです。以下のキーワードで検索する就活生のために、SEO最適化された充実した記事を書いてください。

キーワード: ${keyword}
カテゴリ: ${category}

以下の形式でJSONのみを返してください（コードブロック・説明文は不要）:
{"title":"記事タイトル（30文字以内、キーワードを含む）","meta_desc":"メタディスクリプション（80〜120文字、キーワードを含む）","tags":["タグ1","タグ2","タグ3","タグ4","タグ5"],"content":"記事本文（マークダウン形式）"}

記事本文の構成（必ず守ること）:
1. 冒頭: 以下の画像タグを最初のH2の前に配置
   ![${keyword}の画像](${imageUrl})

2. 構成:
   ## [読者の悩みに共感するH2見出し]
   （300〜400字の本文）

   ## [具体的な方法・手順のH2見出し]
   （箇条書きや番号付きリストで具体的に、300〜400字）

   ## [実例・例文のH2見出し]
   （具体的な例文や実例を含む、400〜500字）

   ![実践イメージ](${imageUrl2})

   ## [よくある失敗・注意点のH2見出し]
   （300〜400字）

   ## 参考になるサービス・サイト
   ${linksText}

   ## まとめ
   （200〜300字でまとめ）

記事の条件:
- 合計2500〜3500字
- 読者は就活中の大学生
- 具体的な数字・例文を含める
- 自然な日本語、読みやすい文体
- タグは5個、カテゴリ関連のキーワードを選ぶ`

  let parsed: { title?: unknown; meta_desc?: unknown; content?: unknown; tags?: unknown } | null = null
  let lastError = ''

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { maxOutputTokens: 8192 },
      })

      const rawText = response.text ?? ''
      const raw = rawText.replace(/```json\n?|\n?```/g, '').trim()

      // JSON部分だけ抽出（前後に余計な文字がある場合に対応）
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : raw

      parsed = JSON.parse(jsonStr)
      if (parsed && parsed.title && parsed.content && parsed.meta_desc) break

      lastError = 'missing required fields'
    } catch (e) {
      lastError = e instanceof Error ? e.message.slice(0, 100) : String(e)
      if (attempt < 3) await new Promise(r => setTimeout(r, 3000 * attempt))
    }
  }

  if (!parsed || !parsed.title || !parsed.content || !parsed.meta_desc) {
    throw new Error(`Gemini failed after 3 attempts: ${lastError}`)
  }

  return {
    title: parsed.title as string,
    content: parsed.content as string,
    meta_desc: parsed.meta_desc as string,
    tags: Array.isArray(parsed.tags) ? parsed.tags as string[] : [],
    slug: toSlug(keyword),
    keyword,
    category,
  }
}
