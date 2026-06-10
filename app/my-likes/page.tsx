import { Metadata } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { MyLikesList } from '@/components/MyLikesList'

export const metadata: Metadata = {
  title: 'いいねした記事',
  description: 'あなたがいいねした就活ナビの記事一覧です',
}

// クライアントから fetch するため動的レンダリング
export const dynamic = 'force-dynamic'

export default function MyLikesPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <SiteHeader />

      <section style={{ backgroundColor: 'var(--dark-mid)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ width: 28, height: 2, backgroundColor: 'var(--accent)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
              My Likes
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            ❤️ いいねした記事
          </h1>
          <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
            このブラウザでいいねを押した記事の一覧
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <MyLikesList />
      </main>

      <SiteFooter />
    </div>
  )
}
