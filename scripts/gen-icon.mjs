/**
 * オリジナルfavicon/アイコン生成。glyph + 配色を指定して
 * app/icon.png (512) / app/apple-icon.png (180) / app/favicon.ico (16,32,48) を出力。
 *
 * 使い方: node scripts/gen-icon.mjs "就" "#C84B31" "#B23E28" "#F8F3EA"
 *   引数: glyph  tileTop  tileBottom  glyphColor   (省略時は就活ナビ既定)
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFile } from 'node:fs/promises'

const [, , glyph = '就', top = '#C84B31', bottom = '#B23E28', fg = '#F8F3EA'] =
  process.argv

const SIZE = 512
const radius = Math.round(SIZE * 0.205)
const fontSize = Math.round(SIZE * 0.58)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
  <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="${radius - 6}" ry="${radius - 6}"
        fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="3"/>
  <text x="50%" y="52%" font-family="Hiragino Sans, 'Noto Sans JP', sans-serif"
        font-size="${fontSize}" font-weight="900" fill="${fg}"
        text-anchor="middle" dominant-baseline="central">${glyph}</text>
</svg>`

const base = Buffer.from(svg)

async function png(size) {
  return sharp(base).resize(size, size).png().toBuffer()
}

// app/icon.png (512) + apple-icon.png (180)
await writeFile('app/icon.png', await png(512))
await writeFile('app/apple-icon.png', await png(180))

// favicon.ico (multi-size)
const icoSizes = await Promise.all([16, 32, 48].map(png))
await writeFile('app/favicon.ico', await pngToIco(icoSizes))

console.log(`✓ generated icon "${glyph}": app/icon.png, app/apple-icon.png, app/favicon.ico`)
