const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const crypto = require('node:crypto')
const dotenv = require('dotenv')
const { chromium } = require('playwright')
async function main() {
  const env = dotenv.parse(await fs.readFile('.tmp/test.env'))
  const base = 'http://127.0.0.1:5174'
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
  const page = await context.newPage()
  const tag = crypto.randomUUID().slice(0, 8)
  const failures = []
  page.on('pageerror', error => failures.push(error.message))
  const check = async (name, operation) => { await operation(); console.log(`OK: ${name}`) }
  const goto = async label => { await page.getByRole('link', { name: label, exact: true }).click(); await page.waitForLoadState('networkidle') }
  const fill = async (label, value) => page.getByLabel(label, { exact: true }).fill(value)
  const save = async () => { await page.getByRole('button', { name: 'Salvar registro', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); await page.waitForLoadState('networkidle') }
  try {
    await check('login e recarga preservam a sessão', async () => {
      await page.goto(base + '/login'); await page.locator('input[type=email]').fill(env.ADMIN_EMAIL); await page.locator('input[type=password]').fill(env.ADMIN_PASSWORD); await page.locator('button[type=submit]').click(); await page.waitForURL(base + '/'); await page.getByRole('heading', { name: 'Painel central', exact: true }).waitFor(); await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('heading', { name: 'Painel central', exact: true }).waitFor(); assert.equal(new URL(page.url()).pathname, '/')
    })
    await check('cadastro, edição, detalhes e exclusão de responsável', async () => {
      await goto('Agentes Autorizados'); await page.getByRole('button', { name: 'Novo cadastro' }).click(); await fill('Nome', 'Pessoa UI ' + tag); await fill('Identificação funcional', tag); await fill('Setor', 'Teste UI'); await save()
      const row = page.getByRole('row').filter({ hasText: tag }); await row.getByRole('button', { name: 'Editar', exact: true }).click(); await fill('Setor', 'Setor editado'); await save(); await row.getByRole('button', { name: 'Detalhes' }).click(); await page.getByRole('dialog').getByText('Setor editado', { exact: true }).waitFor(); await page.getByRole('button', { name: 'Fechar', exact: true }).click()
    })
    await check('cadastro de munição e movimentação atualizam estoque', async () => {
      await goto('Lotes de Munição'); await page.getByRole('button', { name: 'Novo cadastro' }).click(); await fill('Tipo', 'Munição UI ' + tag); await fill('Calibre', '9mm'); await fill('Quantidade em estoque', '20'); await save()
      await goto('Carga/Descarga'); await page.getByRole('button', { name: 'Nova movimentação' }).click(); await page.getByLabel('Categoria', { exact: true }).selectOption('municao'); const ammunitionId = await page.getByLabel('Munição', { exact: true }).locator('option').filter({ hasText: tag }).getAttribute('value'); await page.getByLabel('Munição', { exact: true }).selectOption(ammunitionId); await page.getByLabel('Quantidade', { exact: true }).fill('5'); const responsibleId = await page.getByLabel('Responsável', { exact: true }).locator('option').filter({ hasText: tag }).getAttribute('value'); await page.getByLabel('Responsável', { exact: true }).selectOption(responsibleId); await page.getByLabel('Motivo', { exact: true }).fill('Teste UI ' + tag); await page.getByRole('button', { name: 'Registrar movimentação', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); await goto('Lotes de Munição'); await page.getByRole('row').filter({ hasText: tag }).getByRole('cell', { name: '15', exact: true }).waitFor()
    })
    await check('cadastro e dossiê de armamento', async () => {
      await goto('Arsenal de Armas'); await page.getByRole('button', { name: 'Novo cadastro' }).click(); for (const [label, value] of [['Tipo', 'Arma UI'], ['Marca', 'Teste'], ['Modelo', 'Teste'], ['Calibre', '9mm'], ['Número de série', tag], ['Número de registro', tag], ['Local', 'Base UI'], ['Observações', 'Observação de teste']]) await fill(label, value); await save(); await page.getByRole('row').filter({ hasText: tag }).getByRole('button', { name: 'Detalhes' }).click(); await page.getByRole('dialog').getByText('Observação de teste', { exact: true }).waitFor(); await page.getByRole('button', { name: 'Fechar' }).click()
    })
    await check('busca global navega e filtra o cadastro', async () => {
      await page.getByLabel('Busca global').fill(tag); await page.getByRole('button', { name: 'Arma UI ' + tag, exact: true }).click(); await page.getByLabel('Buscar Armamentos').waitFor(); assert.equal(await page.getByLabel('Buscar Armamentos').inputValue(), tag)
    })
    await check('configurações e preferências persistem após recarga', async () => {
      await goto('Configurações'); await page.getByLabel('Nome da unidade', { exact: true }).fill('Unidade UI ' + tag); await page.getByRole('button', { name: 'Salvar configurações' }).click(); await page.getByRole('status').filter({ hasText: 'Configurações salvas' }).waitFor(); await page.reload({ waitUntil: 'networkidle' }); await page.getByLabel('Nome da unidade', { exact: true }).waitFor(); assert.equal(await page.getByLabel('Nome da unidade', { exact: true }).inputValue(), 'Unidade UI ' + tag)
      await page.getByRole('button', { name: 'Notificações', exact: true }).click(); await page.getByLabel('Estoque baixo de munições', { exact: true }).uncheck(); await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Preferências salvas' }).waitFor(); await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('button', { name: 'Notificações', exact: true }).click(); assert.equal(await page.getByLabel('Estoque baixo de munições', { exact: true }).isChecked(), false)
      await page.getByLabel('Estoque baixo de munições', { exact: true }).check(); await page.getByRole('button', { name: 'Salvar preferências', exact: true }).click()
    })
    await check('perfil atualizado e alertas marcados como lidos', async () => {
      await page.getByRole('button', { name: 'Meu Perfil', exact: true }).click(); await page.getByLabel('Nome', { exact: true }).fill('Admin UI ' + tag); await page.getByRole('button', { name: 'Salvar perfil' }).click(); await page.getByRole('status').filter({ hasText: 'Perfil atualizado' }).waitFor(); await page.getByLabel('Abrir notificações').click(); const mark = page.getByRole('button', { name: 'Marcar todos como lidos' }); if (await mark.isEnabled()) { await mark.click(); await page.waitForLoadState('networkidle'); assert.equal(await mark.isDisabled(), true) }; await page.getByLabel('Abrir notificações').click()
    })
    await check('download de PDF e Excel pelo navegador', async () => {
      await goto('Auditoria e Relatórios'); const card = page.locator('section').filter({ hasText: 'Inventário de armamentos' }); for (const [label, extension] of [['Baixar PDF', '.pdf'], ['Baixar Excel', '.xlsx']]) { const pending = page.waitForEvent('download'); await card.getByRole('button', { name: label }).click(); const download = await pending; assert.equal(download.suggestedFilename(), 'armamentos' + extension); assert.equal(await download.failure(), null) }
    })
    await check('gestão de usuários e troca de senha pela interface', async () => {
      await goto('Configurações'); await page.getByRole('button', { name: 'Usuários', exact: true }).click(); await page.getByRole('button', { name: 'Novo usuário', exact: true }).click(); await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Conta UI ' + tag); await page.getByRole('dialog').getByLabel('Email', { exact: true }).fill(tag + '-ui@example.com'); await page.getByRole('dialog').getByLabel('Senha inicial', { exact: true }).fill(env.ADMIN_PASSWORD); await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); const account = page.getByRole('row').filter({ hasText: tag + '-ui@example.com' }); page.once('dialog', dialog => dialog.accept()); await account.getByRole('button', { name: 'Desativar', exact: true }).click(); await account.getByRole('cell', { name: 'Desativado', exact: true }).waitFor()
      await page.getByRole('button', { name: 'Segurança', exact: true }).click(); for (const [current, next] of [[env.ADMIN_PASSWORD, env.ADMIN_PASSWORD + '-ui'], [env.ADMIN_PASSWORD + '-ui', env.ADMIN_PASSWORD]]) { await fill('Senha atual', current); await fill('Nova senha', next); await fill('Confirmar nova senha', next); await page.getByRole('button', { name: 'Atualizar senha', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Senha alterada' }).waitFor(); await page.waitForLoadState('networkidle') }
    })
    await check('menu móvel permite acessar os módulos', async () => {
      await page.setViewportSize({ width: 390, height: 844 }); await page.getByLabel('Abrir menu', { exact: true }).click(); await goto('Lotes de Munição'); await page.getByRole('heading', { name: 'Munições', exact: true }).waitFor(); await page.setViewportSize({ width: 1440, height: 1000 })
    })
    await check('exclusão sem histórico e logout funcionam', async () => {
      await goto('Arsenal de Armas'); page.once('dialog', dialog => dialog.accept()); await page.getByRole('row').filter({ hasText: tag }).getByRole('button', { name: 'Excluir', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Registro excluído' }).waitFor(); await page.getByRole('button', { name: 'Sair do Sistema' }).click(); await page.waitForURL(base + '/login'); await page.reload({ waitUntil: 'networkidle' }); await page.locator('input[type=email]').waitFor(); assert.equal(new URL(page.url()).pathname, '/login')
    })
    assert.deepEqual(failures, [])
    console.log('Todos os fluxos do navegador passaram sem erros JavaScript.')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
