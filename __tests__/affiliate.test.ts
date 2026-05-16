// __tests__/affiliate.test.ts
import { describe, it, expect } from 'vitest'
import { injectAffiliateLinks } from '../lib/affiliate'

describe('injectAffiliateLinks', () => {
  it('マイナビというキーワードにリンクを挿入する', () => {
    const input = 'マイナビは有名な就活サイトです。リクナビも人気です。'
    const result = injectAffiliateLinks(input)
    expect(result).toContain('href=')
    expect(result).toContain('マイナビ就活（無料登録）')
  })

  it('同じキーワードは最初の出現だけに挿入する', () => {
    const input = 'マイナビを使いましょう。マイナビは良いです。'
    const result = injectAffiliateLinks(input)
    const count = (result.match(/マイナビ就活（無料登録）/g) ?? []).length
    expect(count).toBeLessThanOrEqual(1)
  })

  it('リンクがない文章はそのまま返す', () => {
    const input = '面接の準備をしましょう。'
    const result = injectAffiliateLinks(input)
    expect(result).toBe(input)
  })
})
