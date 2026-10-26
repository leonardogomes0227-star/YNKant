// Gera os ícones PNG do PWA a partir de public/icon.svg.
// Uso (precisa do Playwright instalado globalmente ou no projeto): npm run icons
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const svg = readFileSync('public/icon.svg', 'utf8')
// versão "maskable": fundo sem cantos arredondados e o desenho menor (zona segura)
const maskable = svg
  .replace(/<rect width="512" height="512" rx="112"[^>]*\/>/, '<rect width="512" height="512" fill="#0d0e10"/>')
  .replace(/<rect x="3"[^>]*\/>/, '')
  .replace(/(<circle cx="256" cy="256" r="150")/, '<g transform="translate(256 256) scale(.72) translate(-256 -256)">$1')
  .replace('</svg>', '</g></svg>')

const jobs = [
  ['public/icons/icon-192.png', svg, 192],
  ['public/icons/icon-512.png', svg, 512],
  ['public/icons/icon-180.png', svg, 180],
  ['public/icons/icon-maskable-512.png', maskable, 512],
]

mkdirSync('public/icons', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, source, size] of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0;background:transparent">${source.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
  writeFileSync(file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }))
  console.log('ok', file)
}
await browser.close()
