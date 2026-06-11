import type { Metadata } from "next";
import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google'
import { AdSenseScript } from '@/components/AdSenseScript'
import "./globals.css";

const notoSerifJP = Noto_Serif_JP({
  weight: ['400', '600', '700', '900'],
  display: 'swap',
  variable: '--font-noto-serif',
  preload: false,
})

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'),
  title: {
    default: '就活ナビ｜28卒就活完全攻略ガイド',
    template: '%s｜就活ナビ',
  },
  description: '就活ナビは28卒向けES・面接・インターン・業界研究の完全攻略ガイド。自己PR・グループディスカッション・OB訪問まで内定獲得のノウハウを網羅。',
  openGraph: {
    siteName: '就活ナビ',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: 'https://shukatsunavi.vercel.app/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://shukatsunavi.vercel.app/og-default.png'],
  },
  // RSS フィードを <link rel="alternate"> として全ページに出力（AI/RSS リーダーの発見経路）
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  // Google Search Console のサイト所有権確認（env に確認コードを設定すると <meta> が出力される）
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '就活ナビ',
    url: siteUrl,
    logo: `${siteUrl}/og-default.png`,
    description: '28卒向けのES・面接・インターン・業界研究の就活攻略ガイド。',
  }

  return (
    <html lang="ja" className={`h-full antialiased ${notoSerifJP.variable} ${notoSansJP.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* サイト全体の Organization 構造化データ（XSS対策: < を unicode エスケープ） */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
        <AdSenseScript />
      </body>
    </html>
  );
}
