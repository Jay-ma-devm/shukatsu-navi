'use client'

import Link from 'next/link'
import { useState } from 'react'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'var(--dark)',
        borderBottom: '3px solid var(--accent)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="group">
          <p
            className="text-white text-xl font-black tracking-tight group-hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            就活ナビ
          </p>
          <p className="text-xs tracking-widest uppercase mt-0.5" style={{ color: 'var(--accent)', opacity: 0.8 }}>
            Job Hunting Guide
          </p>
        </Link>

        {/* 右側ナビ（PC） */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/"
            className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
          >
            記事一覧
          </Link>
          <Link
            href="/#categories"
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
          >
            カテゴリ
          </Link>
          <Link
            href="/my-likes"
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
            aria-label="いいねした記事"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
            </svg>
            いいね
          </Link>
        </nav>

        {/* ハンバーガー（モバイル） */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg transition-colors hover:bg-white/10"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="メニューを開く"
          aria-expanded={menuOpen}
        >
          <span
            className="block w-6 h-0.5 bg-white transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? 'rotate(45deg) translate(2px, 3px)' : 'none' }}
          />
          <span className="block w-6 h-0.5 bg-white transition-all duration-300" style={{ opacity: menuOpen ? 0 : 1 }} />
          <span
            className="block w-6 h-0.5 bg-white transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? 'rotate(-45deg) translate(2px, -3px)' : 'none' }}
          />
        </button>
      </div>

      {/* モバイルメニュー */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? '200px' : '0px',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}
      >
        <nav className="px-6 py-4 flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm px-4 py-3 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
            onClick={() => setMenuOpen(false)}
          >
            📰 記事一覧
          </Link>
          <Link
            href="/#categories"
            className="flex items-center gap-3 text-sm px-4 py-3 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
            onClick={() => setMenuOpen(false)}
          >
            🗂️ カテゴリ一覧
          </Link>
          <Link
            href="/my-likes"
            className="flex items-center gap-3 text-sm px-4 py-3 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#D1D5DB' }}
            onClick={() => setMenuOpen(false)}
          >
            ❤️ いいねした記事
          </Link>
        </nav>
      </div>
    </header>
  )
}
