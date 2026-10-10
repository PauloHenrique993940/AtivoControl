const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require('playwright')
const dotenv = require('dotenv')

async function main() {
  const baseURL = process.env.DOCS_BASE_URL || 'https://ativocontrol.vercel.app'
  const credentials = dotenv.parse(await fs.readFile('backend/.env'))
  const media = path.resolve('docs/media')
  await fs.mkdir(media, { recursive: true })
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: path.join(media, 'recordings'), size: { width: 1440, height: 1000 } } })
    const page = await context.newPage()
    const video = page.video()
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(media, '01-login.png'), fullPage: true })
    await page.waitForTimeout(1800)
    const response = await context.request.post(`${baseURL}/api/auth/login`, { data: { email: credentials.ADMIN_EMAIL, password: credentials.ADMIN_PASSWORD } })
    if (!response.ok()) throw new Error(`Login falhou: ${response.status()}`)
    const { token, user } = await response.json()
    await page.evaluate(({ token, user }) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)) }, { token, user })
    await page.reload({ waitUntil: 'networkidle' })
    const screens = [
      ['/', '02-dashboard', 'Painel Central'],
      ['/armamentos', '03-armamentos', 'Arsenal de Armas'],
      ['/municoes', '04-municoes', 'Lotes de Munição'],
      ['/responsaveis', '05-responsaveis', 'Agentes Autorizados'],
      ['/movimentacoes', '06-movimentacoes', 'Carga/Descarga'],
      ['/relatorios', '07-relatorios', 'Auditoria e Relatórios'],
      ['/configuracoes', '08-configuracoes', 'Configurações'],
    ]
    for (const [route, name, label] of screens) {
      if (route === '/') await page.evaluate(() => { history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) })
      else await page.getByRole('link', { name: label, exact: true }).click()
      await page.waitForLoadState('networkidle')
      await page.locator('aside').waitFor({ state: 'visible' })
      await page.waitForTimeout(1300)
      await page.waitForURL(url => url.pathname.replace(/\/$/, '') === route.replace(/\/$/, ''))
      await page.screenshot({ path: path.join(media, `${name}.png`), fullPage: true })
      await page.waitForTimeout(1500)
      console.log(`Capturada ${route}`)
    }
    await context.close()
    await video.saveAs(path.join(media, 'tour-aplicacao.webm'))
    await video.delete()

    const apiContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: path.join(media, 'recordings'), size: { width: 1440, height: 1000 } } })
    const apiPage = await apiContext.newPage()
    const apiVideo = apiPage.video()
    await apiPage.goto(`${baseURL}/api/docs`, { waitUntil: 'networkidle' })
    await apiPage.locator('.swagger-ui').waitFor({ state: 'visible' })
    await apiPage.screenshot({ path: path.join(media, '09-swagger.png'), fullPage: true })
    await apiPage.waitForTimeout(2500)
    await apiPage.locator('#operations-Sistema-get_health .opblock-summary').click()
    await apiPage.waitForTimeout(1200)
    await apiPage.getByRole('button', { name: 'Try it out' }).click()
    await apiPage.getByRole('button', { name: 'Execute', exact: true }).click()
    await apiPage.locator('.live-responses-table').waitFor({ state: 'visible' })
    await apiPage.waitForTimeout(2500)
    await apiPage.screenshot({ path: path.join(media, '10-swagger-health.png'), fullPage: true })
    await apiPage.mouse.wheel(0, 650)
    await apiPage.waitForTimeout(2500)
    await apiContext.close()
    await apiVideo.saveAs(path.join(media, 'tour-swagger.webm'))
    await apiVideo.delete()
    console.log('Vídeos e capturas salvos em docs/media; nenhuma credencial foi gravada.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
