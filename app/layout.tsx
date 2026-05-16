import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: '就活攻略ガイド', template: '%s | 就活攻略ガイド' },
  description: 'ES・面接・インターンを攻略する就活生のための情報サイト',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
