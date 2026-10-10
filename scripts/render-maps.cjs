const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('playwright')

async function main() {
  const markdown = await fs.readFile('docs/ARQUITETURA.md', 'utf8')
  const diagrams = [...markdown.matchAll(/```mermaid\s*([\s\S]*?)```/g)].map(match => match[1])
  const names = ['mapa-producao', 'mapa-docker', 'mapa-navegacao', 'mapa-dados']
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
    await page.setContent('<html><body style="margin:32px;background:white"><div id="diagram"></div></body></html>')
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.min.js' })
    await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' }))
    for (let i = 0; i < diagrams.length; i++) {
      const svg = await page.evaluate(async ({ code, index }) => {
        await mermaid.parse(code)
        const { svg } = await mermaid.render(`map${index}`, code)
        document.getElementById('diagram').innerHTML = svg
        return svg
      }, { code: diagrams[i], index: i })
      await fs.writeFile(path.join('docs/media', `${names[i]}.svg`), svg)
      await page.locator('#diagram').screenshot({ path: path.join('docs/media', `${names[i]}.png`) })
      console.log(`Mapa validado e renderizado: ${names[i]}`)
    }
    const readme = await fs.readFile('README.md', 'utf8')
    for (const match of readme.matchAll(/```mermaid\s*([\s\S]*?)```/g)) await page.evaluate(code => mermaid.parse(code), match[1])
  } finally { await browser.close() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
