# 就活ナビ（Shukatsu Navi）

> 28卒のための、就活完全攻略ガイド。<br>
> ES・面接・インターン・OB訪問・業界研究をひとつにまとめた、SEO型コンテンツメディア。

公開URL: <https://shukatsu-navi-jp.vercel.app>

---

## 何をしているか

既存の就活メディアでは取りこぼされている、**28卒・地方学生・特定業界に絞った深い記事**を、AI で量産しつつ編集チェックを通して公開しています。記事は 100 本超、6 カテゴリで運用中。

| カテゴリ | 内容 |
|---|---|
| ✍️ ES・自己PR | ガクチカ・自己PRの書き方を徹底解説 |
| 🎤 面接対策 | 頻出質問から逆質問まで完全対策 |
| 💼 インターン | 選考突破から参加後の活かし方まで |
| 🔍 業界研究 | 業界別の傾向と対策 |
| 🤝 OB・OG訪問 | アポ取りから質問例まで完全ガイド |
| 📝 SPI・筆記 | 出題傾向と対策 |

## 技術スタック

| Layer | 技術 |
|---|---|
| Frontend | Next.js (App Router, ISR), React, TypeScript |
| Backend | Supabase（記事・カテゴリ・キーワード管理） |
| Content Pipeline | Gemini API + レートリミット制御スクリプト |
| Hosting | Vercel |

## ローカル起動

```bash
npm install
cp .env.example .env.local  # Supabase URL/Key を設定
npm run dev
```

## 記事生成パイプライン

`scripts/` 配下に、Gemini を使った記事の bulk-generate、品質スコアによる upgrade、カテゴリ別の埋め直しスクリプトが入っています。

## アーキテクチャの特徴

- **ISR + revalidate** — 30 分単位で記事リストを再生成
- **カテゴリ別 Featured 抽出** — 各カテゴリの上位記事をトップに表示
- **タグ / カテゴリ / ページネーション** — URL パラメータ駆動で SEO に強い構造

## ライセンス

MIT
