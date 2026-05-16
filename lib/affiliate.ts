// lib/affiliate.ts
const AFFILIATE_MAP: Record<string, { url: string; label: string }> = {
  'マイナビ': {
    url: 'https://job.mynavi.jp/?af=affiliate_id_here',
    label: 'マイナビ就活（無料登録）',
  },
  'リクナビ': {
    url: 'https://job.rikunabi.com/?af=affiliate_id_here',
    label: 'リクナビ（無料登録）',
  },
  'キャリアチケット': {
    url: 'https://careerticket.jp/?af=affiliate_id_here',
    label: 'キャリアチケット（無料相談）',
  },
}

export function injectAffiliateLinks(content: string): string {
  let result = content
  const injected = new Set<string>()

  for (const [keyword, { url, label }] of Object.entries(AFFILIATE_MAP)) {
    if (injected.has(keyword)) continue
    const index = result.indexOf(keyword)
    if (index === -1) continue

    const link = `<a href="${url}" target="_blank" rel="noopener noreferrer sponsored">${label}</a>`
    result = result.slice(0, index) + link + result.slice(index + keyword.length)
    injected.add(keyword)
  }

  return result
}
