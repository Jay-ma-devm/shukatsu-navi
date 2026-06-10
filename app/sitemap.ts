import type { MetadataRoute } from 'next'
import { getAllSlugs, getCategories } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shukatsunavi.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, { categories, tags }] = await Promise.all([
    getAllSlugs(),
    getCategories(),
  ])

  const articles: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryPages: MetadataRoute.Sitemap = categories.map(([name]) => ({
    url: `${BASE_URL}/category/${encodeURIComponent(name)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const tagPages: MetadataRoute.Sitemap = tags.map(([name]) => ({
    url: `${BASE_URL}/tag/${encodeURIComponent(name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryPages,
    ...articles,
    ...tagPages,
  ]
}
