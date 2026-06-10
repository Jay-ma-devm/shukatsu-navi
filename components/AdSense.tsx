'use client'

import { useEffect } from 'react'

// Google AdSenseのclient IDは環境変数で管理
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? ''

type AdSlotProps = {
  slot: string
  format?: 'auto' | 'fluid' | 'rectangle'
  responsive?: boolean
  style?: React.CSSProperties
}

declare global {
  interface Window {
    adsbygoogle?: object[]
  }
}

export function AdSense({ slot, format = 'auto', responsive = true, style }: AdSlotProps) {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense push failed:', e)
    }
  }, [])

  // 未設定なら綺麗なプレースホルダー
  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className="rounded-lg flex items-center justify-center text-sm my-8"
        style={{
          backgroundColor: 'var(--surface-alt)',
          border: '1px dashed var(--border)',
          minHeight: 90,
          color: 'var(--text-muted)',
          ...style,
        }}
      >
        広告スペース（Google AdSense）
      </div>
    )
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', minHeight: 90, ...style }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}
