import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import prisma from '../lib/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { audit, armamentSchema, armamentBatchSchema, ammunitionSchema, ammunitionEntrySchema, vestSchema, validateVestDates, responsibleSchema, movementSchema, transaction, route, roles, managers, operators, userSelect, HttpError, id, text, roleNames, settings, settingsSchema, preferencesSchema, dateFilter } from '../lib/domain'
import { registerMovement, movementInclude } from '../services/movements'
import { dashboard, notifications } from '../services/overview'
import { exportReport } from '../services/reports'

const router = Router()
const tokenFor = (user: { id: string; role: string; tokenVersion: number }) => jwt.sign({ id: user.id, role: user.role, version: user.tokenVersion }, process.env.JWT_SECRET!, { expiresIn: '1d', algorithm: 'HS256' })
const loginLimiter = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde 15 minutos.' } })
router.post('/auth/login', loginLimiter, route(async (req, res) => {
  const input = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(1).max(200) }).parse(req.body)
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user?.active || !await bcrypt.compare(input.password, user.password)) throw new HttpError(401, 'Credenciais inválidas.')
  await audit(prisma, user.id, 'LOGIN', 'Login efetuado')
  const { password, tokenVersion, ...safe } = user
  res.json({ user: safe, token: tokenFor(user) })
}))
router.use(authMiddleware)
router.get('/auth/me', route(async (req, res) => res.json(await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: userSelect }))))
router.put('/auth/profile', route(async (req, res) => {
  const input = z.object({ name: text, email: z.email().trim().toLowerCase() }).strict().parse(req.body)
  res.json(await transaction(async tx => { const user = await tx.user.update({ where: { id: req.userId }, data: input, select: userSelect }); await audit(tx, req.userId, 'ALTERAR_PERFIL', user.email); return user }))
}))
router.put('/auth/password', loginLimiter, route(async (req, res) => {
  const input = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12).max(200) }).strict().parse(req.body)
  const current = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } })
  if (!await bcrypt.compare(input.currentPassword, current.password)) throw new HttpError(400, 'Senha atual incorreta.')
  if (input.currentPassword === input.newPassword) throw new HttpError(400, 'Nova senha deve ser diferente da atual.')
  const hash = await bcrypt.hash(input.newPassword, 12)
  const user = await transaction(async tx => {
    const latest = await tx.user.findUniqueOrThrow({ where: { id: req.userId } })
    if (latest.password !== current.password) throw new HttpError(409, 'Senha já alterada. Entre novamente.')
    const value = await tx.user.update({ where: { id: req.userId }, data: { password: hash, tokenVersion: { increment: 1 } } }); await audit(tx, req.userId, 'ALTERAR_SENHA', 'Sessões anteriores revogadas'); return value
  })
  res.json({ token: tokenFor(user), user: await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: userSelect }) })
}))
router.post('/auth/logout', route(async (req, res) => { await prisma.user.update({ where: { id: req.userId }, data: { tokenVersion: { increment: 1 } } }); res.json({ message: 'Sessões encerradas.' }) }))
router.put('/auth/preferences', route(async (req, res) => { const input = preferencesSchema.parse(req.body); res.json(await transaction(async tx => { const result = await tx.user.update({ where: { id: req.userId }, data: { preferences: input }, select: userSelect }); await audit(tx, req.userId, 'ALTERAR_PREFERENCIAS', JSON.stringify(input)); return result })) }))

// Cadastros compartilham validação, transação e auditoria.
router.post('/armamentos/lote', roles(...managers), route(async (req, res) => {
  const input = armamentBatchSchema.parse(req.body)
  const result = await transaction(async tx => {
    const items = await tx.armament.createManyAndReturn({ data: input.unidades.map(unit => ({ ...input.dados, ...unit })) })
    await audit(tx, req.userId, 'CRIAR_LOTE_ARMAMENTOS', JSON.stringify({ quantidade: items.length, items }))
    return { quantidade: items.length, items }
  })
  res.status(201).json(result)
}))
router.post('/municoes/:id/entrada', roles(...managers), route(async (req, res) => {
  const ammunitionId = id(req)
  const input = ammunitionEntrySchema.parse(req.body)
  const movement = await registerMovement(req.userId, { ...input, tipo: 'ENTRADA', ammunitionId })
  res.status(201).json(movement.ammunition)
}))
for (const [path, model, schema] of [['armamentos', 'armament', armamentSchema], ['municoes', 'ammunition', ammunitionSchema], ['coletes', 'vest', vestSchema], ['responsaveis', 'responsible', responsibleSchema]] as const) {
  router.get(`/${path}`, route(async (_req, res) => { const delegate = (prisma as any)[model]; res.json(await delegate.findMany({ orderBy: { createdAt: 'desc' } })) }))
  router.get(`/${path}/:id`, route(async (req, res) => { const delegate = (prisma as any)[model]; const record = await delegate.findUnique({ where: { id: id(req) }, include: { movements: { include: movementInclude, orderBy: { data: 'desc' } } } }); if (!record) throw new HttpError(404, 'Registro não encontrado.'); res.json(record) }))
  router.post(`/${path}`, roles(...managers), route(async (req, res) => {
    const input = schema.parse(req.body)
    if (['armament', 'vest'].includes(model) && 'status' in input && ['USO', 'MANUTENCAO'].includes(input.status)) throw new HttpError(400, 'Cadastre em estoque e registre a movimentação.')
    if (model === 'vest') validateVestDates(input as z.infer<typeof vestSchema>)
    const result = await transaction(async tx => { const record = await (tx as any)[model].create({ data: input }); await audit(tx, req.userId, `CRIAR_${path.toUpperCase()}`, JSON.stringify(record)); return record })
    res.status(201).json(result)
  }))
  router.put(`/${path}/:id`, roles(...managers), route(async (req, res) => {
    const parsed = schema.partial().strict().parse(req.body)
    const input = Object.fromEntries(Object.entries(parsed).filter(([key]) => Object.prototype.hasOwnProperty.call(req.body, key)))
    if (!Object.keys(input).length) throw new HttpError(400, 'Informe ao menos um campo para atualizar.')
    const recordId = id(req)
    res.json(await transaction(async tx => {
      const delegate = (tx as any)[model]; const current = await delegate.findUnique({ where: { id: recordId } }); if (!current) throw new HttpError(404, 'Registro não encontrado.')
      if (['armament', 'vest'].includes(model) && 'status' in input && input.status !== current.status && (['USO', 'MANUTENCAO'].includes(current.status) || ['USO', 'MANUTENCAO'].includes(input.status!))) throw new HttpError(409, 'Altere uso ou manutenção pela tela de movimentações.')
      if (model === 'vest') validateVestDates({ ...current, ...input })
      const record = await delegate.update({ where: { id: recordId }, data: input }); await audit(tx, req.userId, `ATUALIZAR_${path.toUpperCase()}`, JSON.stringify({ id: recordId, antes: current, depois: record })); return record
    }))
  }))
  router.delete(`/${path}/:id`, roles(...managers), route(async (req, res) => {
    const recordId = id(req)
    await transaction(async tx => {
      const relation = { armament: 'armamentId', ammunition: 'ammunitionId', vest: 'vestId', responsible: 'responsibleId' }[model]
      if (await tx.movement.count({ where: { [relation]: recordId } })) throw new HttpError(409, 'Registro possui movimentações. O histórico deve ser preservado.')
      const record = await (tx as any)[model].delete({ where: { id: recordId } }); await audit(tx, req.userId, `EXCLUIR_${path.toUpperCase()}`, JSON.stringify(record))
    })
    res.json({ message: 'Registro excluído.' })
  }))
}
router.get('/movimentacoes', route(async (req, res) => res.json(await prisma.movement.findMany({ where: { data: dateFilter(req) }, include: movementInclude, orderBy: { data: 'desc' } }))))
router.post('/movimentacoes', roles(...operators), route(async (req, res) => {
  const input = movementSchema.parse(req.body)
  if (input.tipo === 'ENTRADA' && !managers.includes(req.userRole)) throw new HttpError(403, 'Seu perfil não tem permissão para registrar entradas de estoque.')
  res.status(201).json(await registerMovement(req.userId, input))
}))
router.get('/dashboard', route(async (req, res) => res.json(await dashboard(req.userId))))
router.get('/notifications', route(async (req, res) => res.json(await notifications(req.userId))))
router.post('/notifications/read', route(async (req, res) => {
  const input = z.object({ keys: z.array(z.string().max(200)).max(500) }).parse(req.body)
  const valid = new Set((await notifications(req.userId)).map(item => item.key))
  await prisma.notificationRead.createMany({ data: input.keys.filter(key => valid.has(key)).map(key => ({ userId: req.userId, key })), skipDuplicates: true })
  res.json({ message: 'Alertas marcados como lidos.' })
}))
router.get('/settings', route(async (_req, res) => res.json(await settings())))
router.put('/settings', roles('ADMIN'), route(async (req, res) => {
  const input = settingsSchema.parse(req.body)
  res.json(await transaction(async tx => { await tx.systemSettings.upsert({ where: { id: 'global' }, update: { data: input }, create: { id: 'global', data: input } }); await audit(tx, req.userId, 'ALTERAR_CONFIGURACOES', JSON.stringify(input)); return input }))
}))
router.get('/audit', roles('ADMIN', 'GESTOR_ARMARIA', 'AUDITOR'), route(async (req, res) => {
  const query = z.object({ page: z.coerce.number().int().min(1).default(1), acao: z.string().max(100).optional() }).parse(req.query)
  const where = { data: dateFilter(req), ...(query.acao ? { acao: { contains: query.acao, mode: 'insensitive' as const } } : {}) }
  const [items, total] = await Promise.all([prisma.auditLog.findMany({ where, include: { user: { select: { name: true } } }, orderBy: { data: 'desc' }, skip: (query.page - 1) * 30, take: 30 }), prisma.auditLog.count({ where })])
  res.json({ items, total, page: query.page, pages: Math.max(1, Math.ceil(total / 30)) })
}))
router.get('/search', route(async (req, res) => {
  const query = z.object({ term: z.string().trim().min(2).max(100) }).parse(req.query); const contains = { contains: query.term, mode: 'insensitive' as const }
  const [arms, ammo, vests, people] = await Promise.all([prisma.armament.findMany({ where: { OR: ['tipo', 'marca', 'modelo', 'numSerie', 'numRegistro', 'calibre', 'local'].map(key => ({ [key]: contains })) }, take: 15 }), prisma.ammunition.findMany({ where: { OR: [{ tipo: contains }, { calibre: contains }] }, take: 15 }), prisma.vest.findMany({ where: { OR: ['marca', 'modelo', 'tamanho', 'nivelProtecao', 'numSerie', 'numPatrimonio', 'local'].map(key => ({ [key]: contains })) }, take: 15 }), prisma.responsible.findMany({ where: { OR: [{ nome: contains }, { identificacaoFuncional: contains }, { setor: contains }] }, take: 15 })])
  res.json([...arms.map(r => ({ id: r.id, label: `${r.tipo} ${r.numSerie}`, href: `/armamentos?busca=${encodeURIComponent(query.term)}` })), ...ammo.map(r => ({ id: r.id, label: `${r.tipo} ${r.calibre}`, href: `/municoes?busca=${encodeURIComponent(query.term)}` })), ...vests.map(r => ({ id: r.id, label: `Colete ${r.numSerie} · ${r.tamanho}`, href: `/coletes?busca=${encodeURIComponent(query.term)}` })), ...people.map(r => ({ id: r.id, label: r.nome, href: `/responsaveis?busca=${encodeURIComponent(query.term)}` }))])
}))
router.get('/reports/:tipo/:formato', route(async (req, res) => { if (req.params.tipo === 'auditoria' && req.userRole === 'OPERADOR') throw new HttpError(403, 'Sem acesso à auditoria.'); return exportReport(req, res) }))
router.get('/users', roles('ADMIN'), route(async (_req, res) => res.json(await prisma.user.findMany({ select: userSelect, orderBy: { name: 'asc' } }))))
router.post('/users', roles('ADMIN'), route(async (req, res) => {
  const input = z.object({ name: text, email: z.email().trim().toLowerCase(), role: z.enum(roleNames), password: z.string().min(12).max(200) }).strict().parse(req.body)
  const password = await bcrypt.hash(input.password, 12)
  res.status(201).json(await transaction(async tx => { const user = await tx.user.create({ data: { ...input, password }, select: userSelect }); await audit(tx, req.userId, 'CRIAR_USUARIO', JSON.stringify({ id: user.id, email: user.email, role: user.role })); return user }))
}))
router.put('/users/:id', roles('ADMIN'), route(async (req, res) => {
  const userId = id(req); const input = z.object({ name: text.optional(), role: z.enum(roleNames).optional(), active: z.boolean().optional() }).strict().parse(req.body)
  if (userId === req.userId && (input.active === false || (input.role && input.role !== 'ADMIN'))) throw new HttpError(409, 'Você não pode desativar ou rebaixar sua própria conta.')
  res.json(await transaction(async tx => { const user = await tx.user.update({ where: { id: userId }, data: { ...input, tokenVersion: { increment: 1 } }, select: userSelect }); await audit(tx, req.userId, 'ATUALIZAR_USUARIO', JSON.stringify({ id: userId, ...input })); return user }))
}))
export default router
