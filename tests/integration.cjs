const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const crypto = require('node:crypto')
const cp = require('node:child_process')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const ExcelJS = require('exceljs')

const env = dotenv.parse(fs.readFileSync('.tmp/test.env'))
const dbUrl = new URL(env.DATABASE_URL)
if (dbUrl.hostname !== 'localhost' || dbUrl.port !== '55432' || dbUrl.pathname !== '/ativocontrol_test') throw Error('Use exclusivamente o banco isolado de testes.')
Object.assign(process.env, env)
const migrate = (schema) => cp.execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', schema], { env: process.env, stdio: 'pipe' })
fs.mkdirSync('.tmp/baseline/migrations/20261010000000_init_postgresql', { recursive: true })
fs.copyFileSync('backend/prisma/schema.prisma', '.tmp/baseline/schema.prisma')
fs.copyFileSync('backend/prisma/migrations/20261010000000_init_postgresql/migration.sql', '.tmp/baseline/migrations/20261010000000_init_postgresql/migration.sql')
fs.copyFileSync('backend/prisma/migrations/migration_lock.toml', '.tmp/baseline/migrations/migration_lock.toml')
migrate('.tmp/baseline/schema.prisma')
const hash = bcrypt.hashSync(env.ADMIN_PASSWORD, 4)
const legacyId = crypto.randomUUID()
cp.execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'execute', '--schema', '.tmp/baseline/schema.prisma', '--stdin'], { env: process.env, input: `INSERT INTO "User" (id,name,email,password,role,"createdAt","updatedAt") VALUES ('${legacyId}','Administrador teste','${env.ADMIN_EMAIL}','${hash}','ADMIN',NOW(),NOW()) ON CONFLICT (email) DO NOTHING;`, stdio: ['pipe', 'pipe', 'pipe'] })
migrate('backend/prisma/schema.prisma')
const prisma = require('../backend/dist/lib/prisma').default
const app = require('../backend/dist/server').default
let server, base, token, adminId
before(async () => {
  server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); base = `http://localhost:${server.address().port}`
  const user = await prisma.user.findUniqueOrThrow({ where: { email: env.ADMIN_EMAIL } })
  adminId = user.id
  await prisma.user.update({ where: { id: adminId }, data: { password: hash, active: true, role: 'ADMIN' } })
  const login = await request('POST', '/auth/login', { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }, null)
  assert.equal(login.status, 200); token = login.body.token
})
after(async () => { server?.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await prisma.$disconnect() })
async function request(method, path, body, auth = token) {
  const response = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const buffer = Buffer.from(await response.arrayBuffer())
  return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? JSON.parse(buffer) : null, buffer, headers: response.headers }
}
test('migração preserva usuário e mantém o esquema ampliado', async () => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: adminId } }); assert.equal(user.active, true); assert.equal(typeof user.preferences, 'object'); assert.equal(await bcrypt.compare(env.ADMIN_PASSWORD, user.password), true)
})
test('cadastros, atomicidade, concorrência, permissões e exportações', async t => {
  const tag = crypto.randomUUID().slice(0, 8)
  let responsible, armament, ammunition, vest, operator, operatorToken, auditor, auditorToken
  await t.test('validação e CRUD completo preservam histórico', async () => {
    assert.equal((await request('GET', '/armamentos', null, null)).status, 401)
    assert.equal((await request('POST', '/municoes', { tipo: 'Teste', calibre: '9mm', quantidade: -1 })).status, 400)
    responsible = (await request('POST', '/responsaveis', { nome: `Teste ${tag}`, identificacaoFuncional: tag, setor: 'Testes' })).body
    armament = (await request('POST', '/armamentos', { tipo: 'Teste', marca: 'Teste', modelo: 'Teste', calibre: '9mm', numSerie: tag, numRegistro: tag, local: 'Origem' })).body
    ammunition = (await request('POST', '/municoes', { tipo: `Teste ${tag}`, calibre: '9mm', quantidade: 10 })).body
    assert.ok(responsible.id && armament.id && ammunition.id)
    assert.equal((await request('POST', '/responsaveis', { nome: 'Duplicado', identificacaoFuncional: tag, setor: 'Testes' })).status, 409)
    assert.equal((await request('PUT', `/responsaveis/${responsible.id}`, { setor: 'Novo setor' })).body.setor, 'Novo setor')
    assert.equal((await request('PUT', `/municoes/${ammunition.id}`, { tipo: 'Editada' })).body.tipo, 'Editada')
    assert.equal((await request('PUT', `/armamentos/${armament.id}`, { local: 'Novo local' })).body.local, 'Novo local')
    assert.equal((await request('GET', '/armamentos/invalido')).status, 400)
    assert.equal((await request('GET', `/armamentos/${crypto.randomUUID()}`)).status, 404)
    const spare = (await request('POST', '/municoes', { tipo: 'Excluir', calibre: 'Teste', quantidade: 0 })).body
    assert.equal((await request('DELETE', `/municoes/${spare.id}`)).status, 200)
  })
  await t.test('quantidade de pistolas cria unidades identificáveis e falhas revertem o lote inteiro', async () => {
    const dados = { tipo: 'Pistola', marca: 'Teste', modelo: 'Lote', calibre: '9mm', local: 'Armaria teste' }
    const unidades = [1, 2].map(index => ({ numSerie: `${tag}-lote-${index}`, numRegistro: `${tag}-registro-${index}` }))
    const before = await prisma.armament.count()
    const auditBefore = await prisma.auditLog.count()
    assert.equal((await request('POST', '/armamentos/lote', { quantidade: 3, dados, unidades })).status, 400)
    assert.equal((await request('POST', '/armamentos/lote', { quantidade: 0, dados, unidades: [] })).status, 400)
    assert.equal((await request('POST', '/armamentos/lote', { quantidade: 101, dados, unidades })).status, 400)
    assert.equal((await request('POST', '/armamentos/lote', { quantidade: 2, dados, unidades: [unidades[0], unidades[0]] })).status, 400)
    assert.equal(await prisma.armament.count(), before)
    assert.equal(await prisma.auditLog.count(), auditBefore)
    const created = await request('POST', '/armamentos/lote', { quantidade: 2, dados, unidades })
    assert.equal(created.status, 201)
    assert.equal(created.body.quantidade, 2)
    assert.equal(created.body.items.length, 2)
    assert.equal(new Set(created.body.items.map(item => item.id)).size, 2)
    assert.deepEqual(created.body.items.map(item => item.numSerie).sort(), unidades.map(item => item.numSerie).sort())
    assert.ok(created.body.items.every(item => item.tipo === 'Pistola' && item.status === 'ESTOQUE'))
    const rollbackCount = await prisma.armament.count()
    const rollbackAudit = await prisma.auditLog.count()
    const rollbackSerial = `${tag}-rollback`
    assert.equal((await request('POST', '/armamentos/lote', { quantidade: 2, dados, unidades: [{ numSerie: rollbackSerial, numRegistro: rollbackSerial }, unidades[1]] })).status, 409)
    assert.equal(await prisma.armament.count(), rollbackCount)
    assert.equal(await prisma.auditLog.count(), rollbackAudit)
    assert.equal(await prisma.armament.findUnique({ where: { numSerie: rollbackSerial } }), null)
    const summary = (await request('GET', '/dashboard')).body
    assert.ok(summary.pistolas >= 2 && summary.pistolasEmEstoque >= 2)
  })
  await t.test('coletes preservam dados, validade, responsável e histórico', async () => {
    const payload = { marca: 'Teste', modelo: `Colete ${tag}`, tamanho: 'M', nivelProtecao: 'IIIA', numSerie: `${tag}-colete`, numPatrimonio: `${tag}-patrimonio`, local: 'Armaria teste', dataFabricacao: '2020-01-01', dataValidade: '2035-01-01', observacoes: 'Capa e painéis conferidos' }
    const created = await request('POST', '/coletes', payload)
    assert.equal(created.status, 201); vest = created.body
    assert.equal(vest.status, 'ESTOQUE'); assert.ok(vest.dataAquisicao)
    assert.equal((await request('POST', '/coletes', payload)).status, 409)
    assert.equal((await request('POST', '/coletes', { ...payload, numSerie: tag + '-invalid', numPatrimonio: tag + '-invalid', tamanho: '' })).status, 400)
    assert.equal((await request('POST', '/coletes', { ...payload, numSerie: tag + '-dates', numPatrimonio: tag + '-dates', dataFabricacao: '2036-01-01' })).status, 400)
    assert.equal((await request('PUT', `/coletes/${vest.id}`, { dataFabricacao: '2036-01-01' })).status, 400)
    assert.equal((await request('PUT', `/coletes/${vest.id}`, { dataValidade: '2019-01-01' })).status, 400)
    const edited = await request('PUT', `/coletes/${vest.id}`, { tamanho: 'G', observacoes: 'Tamanho revisado' })
    assert.equal(edited.status, 200); assert.equal(edited.body.tamanho, 'G'); assert.equal(edited.body.status, 'ESTOQUE'); assert.equal(edited.body.local, payload.local)
    const movement = { tipo: 'RETIRADA', motivo: 'Teste de colete', vestId: vest.id, responsibleId: responsible.id }
    assert.equal((await request('POST', '/movimentacoes', { ...movement, armamentId: armament.id })).status, 400)
    assert.equal((await request('POST', '/movimentacoes', movement)).status, 201)
    assert.equal((await request('GET', `/coletes/${vest.id}`)).body.status, 'USO')
    assert.equal((await request('PUT', `/coletes/${vest.id}`, { status: 'ESTOQUE' })).status, 409)
    const other = (await request('POST', '/responsaveis', { nome: 'Responsável de colete', identificacaoFuncional: tag + '-vest-other', setor: 'Teste' })).body
    assert.equal((await request('POST', '/movimentacoes', { ...movement, tipo: 'DEVOLUCAO', responsibleId: other.id })).status, 409)
    assert.equal((await request('POST', '/movimentacoes', { ...movement, tipo: 'DEVOLUCAO' })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...movement, tipo: 'TRANSFERENCIA', destino: 'Reserva' })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...movement, tipo: 'MANUTENCAO' })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...movement, tipo: 'DEVOLUCAO' })).status, 201)
    const detail = (await request('GET', `/coletes/${vest.id}`)).body
    assert.equal(detail.movements.length, 5); assert.equal(detail.local, 'Reserva'); assert.ok(detail.dataManutencao)
    assert.equal(detail.observacoes, 'Tamanho revisado')
    assert.equal((await request('DELETE', `/coletes/${vest.id}`)).status, 409)
    assert.equal((await request('GET', `/search?term=${tag}`)).body.some(item => item.id === vest.id), true)
    const expired = (await request('POST', '/coletes', { ...payload, numSerie: tag + '-expired', numPatrimonio: tag + '-expired', dataFabricacao: '2010-01-01', dataValidade: '2020-01-01' })).body
    assert.equal((await request('POST', '/movimentacoes', { ...movement, vestId: expired.id })).status, 409)
    assert.equal((await request('DELETE', `/coletes/${expired.id}`)).status, 200)
    const summary = (await request('GET', '/dashboard')).body
    assert.ok(summary.coletes >= 1 && summary.coletesEmEstoque >= 1); assert.equal(typeof summary.coletesEmUso, 'number')
  })
  await t.test('retirada concorrente não duplica e falha não cria auditoria', async () => {
    const payload = { tipo: 'RETIRADA', motivo: 'Teste concorrência', armamentId: armament.id, responsibleId: responsible.id }
    const result = await Promise.all([request('POST', '/movimentacoes', payload), request('POST', '/movimentacoes', payload)])
    assert.deepEqual(result.map(r => r.status).sort(), [201, 409])
    assert.equal(await prisma.movement.count({ where: { armamentId: armament.id } }), 1)
    assert.equal((await prisma.armament.findUnique({ where: { id: armament.id } })).status, 'USO')
    assert.equal((await request('DELETE', `/armamentos/${armament.id}`)).status, 409)
    const before = await prisma.auditLog.count()
    assert.equal((await request('POST', '/movimentacoes', payload)).status, 409)
    assert.equal(await prisma.auditLog.count(), before)
    const other = (await request('POST', '/responsaveis', { nome: 'Outro', identificacaoFuncional: tag + '-other', setor: 'Teste' })).body
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'DEVOLUCAO', responsibleId: other.id })).status, 409)
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'DEVOLUCAO' })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'TRANSFERENCIA', destino: 'Destino' })).status, 201)
    assert.equal((await prisma.armament.findUnique({ where: { id: armament.id } })).local, 'Destino')
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'MANUTENCAO' })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'DEVOLUCAO' })).status, 201)
    assert.ok((await prisma.armament.findUnique({ where: { id: armament.id } })).dataManutencao)
    assert.equal((await request('DELETE', `/responsaveis/${responsible.id}`)).status, 409)
  })
  await t.test('estoque não fica negativo e devolução respeita o saldo', async () => {
    const payload = { tipo: 'RETIRADA', motivo: 'Teste estoque', ammunitionId: ammunition.id, responsibleId: responsible.id, quantidade: 7 }
    const result = await Promise.all([request('POST', '/movimentacoes', payload), request('POST', '/movimentacoes', payload)])
    assert.deepEqual(result.map(r => r.status).sort(), [201, 409])
    assert.equal((await prisma.ammunition.findUnique({ where: { id: ammunition.id } })).quantidade, 3)
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'DEVOLUCAO', quantidade: 8 })).status, 409)
    assert.equal((await request('POST', '/movimentacoes', { ...payload, tipo: 'DEVOLUCAO', quantidade: 7 })).status, 201)
    assert.equal((await prisma.ammunition.findUnique({ where: { id: ammunition.id } })).quantidade, 10)
  })
  await t.test('entrada de munição incrementa estoque com histórico, concorrência e limite inteiro', async () => {
    const entry = await request('POST', `/municoes/${ammunition.id}/entrada`, { quantidade: 25, motivo: 'Recebimento teste' })
    assert.equal(entry.status, 201); assert.equal(entry.body.quantidade, 35)
    const record = await prisma.movement.findFirst({ where: { ammunitionId: ammunition.id, tipo: 'ENTRADA' }, orderBy: { data: 'desc' } })
    assert.equal(record.quantidade, 25); assert.equal(record.userId, adminId)
    assert.equal((await request('POST', `/municoes/${ammunition.id}/entrada`, { quantidade: 0, motivo: 'Inválido' })).status, 400)
    assert.equal((await request('POST', `/municoes/${ammunition.id}/entrada`, { quantidade: 1, motivo: '' })).status, 400)
    const withdrawal = { tipo: 'RETIRADA', motivo: 'Saldo por responsável', ammunitionId: ammunition.id, responsibleId: responsible.id, quantidade: 7 }
    assert.equal((await request('POST', '/movimentacoes', withdrawal)).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { tipo: 'ENTRADA', motivo: 'Entrada sem responsável', ammunitionId: ammunition.id, quantidade: 50 })).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...withdrawal, tipo: 'DEVOLUCAO', quantidade: 8 })).status, 409)
    assert.equal((await request('POST', '/movimentacoes', { ...withdrawal, tipo: 'DEVOLUCAO', quantidade: 7 })).status, 201)
    assert.equal((await request('GET', `/municoes/${ammunition.id}`)).body.quantidade, 85)
    const concurrent = await Promise.all([20, 30].map(quantidade => request('POST', `/municoes/${ammunition.id}/entrada`, { quantidade, motivo: 'Entrada concorrente' })))
    assert.deepEqual(concurrent.map(result => result.status), [201, 201])
    assert.equal((await request('GET', `/municoes/${ammunition.id}`)).body.quantidade, 135)
    assert.equal((await request('POST', '/movimentacoes', { tipo: 'ENTRADA', motivo: 'Não permitido para armamento', armamentId: armament.id, quantidade: 1 })).status, 400)
    assert.equal((await request('POST', '/movimentacoes', { tipo: 'ENTRADA', motivo: 'Não permitido para colete', vestId: vest.id, quantidade: 1 })).status, 400)
    const full = (await request('POST', '/municoes', { tipo: 'Limite ' + tag, calibre: '9mm', quantidade: 2147483647 })).body
    const movementsBefore = await prisma.movement.count({ where: { ammunitionId: full.id } })
    const auditBefore = await prisma.auditLog.count()
    assert.equal((await request('POST', `/municoes/${full.id}/entrada`, { quantidade: 1, motivo: 'Ultrapassa limite' })).status, 409)
    assert.equal((await request('POST', `/municoes/${full.id}/entrada`, { quantidade: 2147483648, motivo: 'Fora do intervalo' })).status, 400)
    assert.equal((await request('GET', `/municoes/${full.id}`)).body.quantidade, 2147483647)
    assert.equal(await prisma.movement.count({ where: { ammunitionId: full.id } }), movementsBefore)
    assert.equal(await prisma.auditLog.count(), auditBefore)
    assert.equal((await request('DELETE', `/municoes/${ammunition.id}`)).status, 409)
  })
  await t.test('papéis são aplicados na API e contas desativadas perdem acesso', async () => {
    operator = (await request('POST', '/users', { name: 'Operador teste', email: `${tag}@example.com`, role: 'OPERADOR', password: env.ADMIN_PASSWORD })).body
    operatorToken = (await request('POST', '/auth/login', { email: operator.email, password: env.ADMIN_PASSWORD }, null)).body.token
    assert.equal((await request('POST', '/municoes', { tipo: 'Não permitido', calibre: '9mm' }, operatorToken)).status, 403)
    assert.equal((await request('GET', '/audit', null, operatorToken)).status, 403)
    assert.equal((await request('PUT', '/settings', { unidade: 'Não permitido' }, operatorToken)).status, 403)
    assert.equal((await request('POST', '/coletes', { marca: 'Teste' }, operatorToken)).status, 403)
    assert.equal((await request('POST', '/armamentos/lote', {}, operatorToken)).status, 403)
    assert.equal((await request('POST', `/municoes/${ammunition.id}/entrada`, { quantidade: 1, motivo: 'Não permitido' }, operatorToken)).status, 403)
    assert.equal((await request('POST', '/movimentacoes', { tipo: 'ENTRADA', motivo: 'Não permitido', ammunitionId: ammunition.id, quantidade: 1 }, operatorToken)).status, 403)
    const vestMovement = { tipo: 'RETIRADA', motivo: 'Operador retira colete', vestId: vest.id, responsibleId: responsible.id }
    assert.equal((await request('POST', '/movimentacoes', vestMovement, operatorToken)).status, 201)
    assert.equal((await request('POST', '/movimentacoes', { ...vestMovement, tipo: 'DEVOLUCAO' }, operatorToken)).status, 201)
    auditor = (await request('POST', '/users', { name: 'Auditor teste', email: `${tag}-audit@example.com`, role: 'AUDITOR', password: env.ADMIN_PASSWORD })).body
    auditorToken = (await request('POST', '/auth/login', { email: auditor.email, password: env.ADMIN_PASSWORD }, null)).body.token
    assert.equal((await request('GET', '/audit', null, auditorToken)).status, 200)
    assert.equal((await request('POST', '/movimentacoes', { tipo: 'RETIRADA', motivo: 'Não permitido', armamentId: armament.id }, auditorToken)).status, 403)
    assert.equal((await request('PUT', `/users/${adminId}`, { active: false })).status, 409)
    assert.equal((await request('PUT', `/users/${operator.id}`, { active: false })).status, 200)
    assert.equal((await request('GET', '/auth/me', null, operatorToken)).status, 401)
  })
  await t.test('configurações, alertas e busca persistem no banco', async () => {
    const config = { unidade: 'Unidade teste', sigla: 'TEST', endereco: 'Rua teste', telefone: '000', baixoEstoque: 200, prazoDevolucao: 7, diasManutencao: 180 }
    assert.equal((await request('PUT', '/settings', config)).status, 200)
    assert.equal((await request('GET', '/settings')).body.unidade, config.unidade)
    assert.equal((await request('GET', `/search?term=${tag}`)).body.some(item => item.id === armament.id), true)
    const alerts = (await request('GET', '/notifications')).body
    assert.ok(alerts.some(item => item.message.includes('Editada')))
    assert.equal((await request('POST', '/notifications/read', { keys: alerts.map(item => item.key) })).status, 200)
    assert.equal((await request('GET', '/notifications')).body.every(item => item.read), true)
    assert.equal((await request('PUT', '/auth/preferences', { manutencao: false, estoque: false, devolucao: false })).status, 200)
    assert.deepEqual((await request('GET', '/notifications')).body, [])
    await request('PUT', '/auth/preferences', { manutencao: true, estoque: true, devolucao: true })
    const summary = (await request('GET', '/dashboard')).body
    assert.ok(summary.total >= 1); assert.equal(summary.chart.length, 6)
    const detail = (await request('GET', `/armamentos/${armament.id}`)).body
    assert.equal(detail.movements.length, 5)
  })
  await t.test('PDF e Excel são arquivos reais e filtros são validados', async () => {
    for (const type of ['armamentos', 'coletes', 'municoes', 'responsaveis', 'movimentacoes', 'auditoria']) {
      const pdf = await request('GET', `/reports/${type}/pdf`)
      assert.equal(pdf.status, 200); assert.equal(pdf.buffer.subarray(0, 5).toString(), '%PDF-')
      const excel = await request('GET', `/reports/${type}/xlsx`)
      assert.equal(excel.status, 200)
      const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(excel.buffer)
      assert.ok(workbook.worksheets[0].rowCount >= 2)
    }
    assert.equal((await request('GET', '/reports/auditoria/pdf', null, auditorToken)).status, 200)
    assert.equal((await request('GET', '/reports/movimentacoes/pdf?inicio=2026-12-01&fim=2026-01-01')).status, 400)
    const audit = (await request('GET', '/audit')).body; assert.ok(audit.total > 0); assert.ok(audit.items.every(row => !row.detalhes.includes(env.ADMIN_PASSWORD)))
  })
  await t.test('perfil e senha persistem, tokens antigos são revogados', async () => {
    assert.equal((await request('PUT', '/auth/profile', { name: 'Nome atualizado', email: env.ADMIN_EMAIL })).body.name, 'Nome atualizado')
    assert.equal((await request('PUT', '/auth/password', { currentPassword: 'senha incorreta', newPassword: 'nova senha de teste 123' })).status, 400)
    const old = token
    const updated = await request('PUT', '/auth/password', { currentPassword: env.ADMIN_PASSWORD, newPassword: env.ADMIN_PASSWORD + '-nova' })
    assert.equal(updated.status, 200); token = updated.body.token
    assert.equal((await request('GET', '/auth/me', null, old)).status, 401)
    assert.equal((await request('POST', '/auth/login', { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }, null)).status, 401)
    assert.equal((await request('POST', '/auth/login', { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD + '-nova' }, null)).status, 200)
    assert.equal((await request('POST', '/auth/logout', {})).status, 200)
    assert.equal((await request('GET', '/auth/me')).status, 401)
    await prisma.user.update({ where: { id: adminId }, data: { password: hash } })
  })
})
