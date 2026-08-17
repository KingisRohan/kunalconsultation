/**
 * Generates PWA icons from an inline SVG mark: a paper lambda on ink.
 * Run once (or after changing the mark): node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

// inset: fraction of the canvas the mark is pulled in by (maskable icons need a safe zone).
function markSvg(inset = 0.18) {
  const s = 512
  const top = s * (0.5 - (0.5 - inset) * 0.72)
  const bottom = s * (1 - inset) - s * 0.12
  const spread = s * (0.5 - inset) * 0.62
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" fill="#0E0E0E"/>
  <path d="M ${s / 2} ${top} L ${s / 2 - spread} ${bottom} M ${s / 2} ${top} L ${s / 2 + spread} ${bottom}"
    stroke="#F4F1EC" stroke-width="${s * 0.085}" stroke-linecap="square" fill="none"/>
</svg>`
}

await mkdir(outDir, { recursive: true })

const standard = Buffer.from(markSvg(0.14))
const maskable = Buffer.from(markSvg(0.24))

await sharp(standard).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'))
await sharp(standard).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'))
await sharp(maskable).resize(512, 512).png().toFile(path.join(outDir, 'icon-512-maskable.png'))
await sharp(standard).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'))
await writeFile(path.join(outDir, 'favicon.svg'), markSvg(0.14))

console.log('Icons written to', outDir)
