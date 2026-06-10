import Link from 'next/link'

const FOOTER_CATEGORIES = [
  { name: 'ES・自己PR', icon: '✍️' },
  { name: '面接対策', icon: '🎤' },
  { name: 'インターン', icon: '💼' },
  { name: '業界研究', icon: '🔍' },
  { name: 'OB・OG訪問', icon: '🤝' },
  { name: 'グループディスカッション', icon: '💬' },
  { name: 'マインドセット', icon: '🧠' },
]

const POPULAR_TAGS = [
  '28卒', '自己PR', 'ガクチカ', '面接', 'SPI', 'インターン', 'OB訪問',
  'エントリーシート', '志望動機', '業界研究', 'グループディスカッション', '内定',
]

export function SiteFooter() {
  return (
    <footer style={{ backgroundColor: 'var(--dark)', marginTop: '6rem' }}>
      {/* メインフッター */}
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* サイト概要 */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <p
                className="text-white text-2xl font-black hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                就活ナビ
              </p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                Job Hunting Guide
              </p>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
              ES・自己PR・面接・インターンから業界研究まで、
              就活のすべてのステップをナビゲートするメディアです。
              28卒就活生の内定獲得を全力でサポートします。
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                28卒向け
              </span>
              <span
                className="inline-block text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}
              >
                無料コンテンツ
              </span>
            </div>
          </div>

          {/* カテゴリ */}
          <div>
            <h3
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--accent)' }}
            >
              カテゴリ
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={`/category/${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-2.5 text-sm transition-colors hover:text-white group"
                    style={{ color: '#9CA3AF' }}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="group-hover:underline underline-offset-2">{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 人気タグ */}
          <div>
            <h3
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--accent)' }}
            >
              人気タグ
            </h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="inline-block text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#9CA3AF',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ボトムバー */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: '#6B7280' }}>
            © 2026 就活ナビ. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: '#4B5563' }}>
            当サイトはアフィリエイト広告を利用しています
          </p>
        </div>
      </div>
    </footer>
  )
}
