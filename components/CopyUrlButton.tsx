'use client'

import { useState } from 'react'

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // フォールバック
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        alert('コピーに失敗しました。URL: ' + url)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:opacity-80"
      style={{
        backgroundColor: copied ? '#198754' : 'var(--surface-alt)',
        color: copied ? 'white' : 'var(--text)',
        border: `1px solid ${copied ? '#198754' : 'var(--border)'}`,
      }}
      aria-label="記事のURLをコピー"
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          コピー済み
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          URLをコピー
        </>
      )}
    </button>
  )
}
