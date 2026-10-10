import prisma from '../lib/prisma'
import { settings, preferencesSchema } from '../lib/domain'

export async function notifications(userId: string) {
  const config = await settings()
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const prefs = preferencesSchema.parse(user.preferences)
  const [ammo, arms, reads] = await Promise.all([
    prisma.ammunition.findMany({ where: { quantidade: { lte: config.baixoEstoque } } }),
    prisma.armament.findMany({ where: { status: { not: 'BAIXADA' } }, include: { movements: { orderBy: { data: 'desc' }, take: 1, include: { responsible: true } } } }),
    prisma.notificationRead.findMany({ where: { userId } }),
  ])
  const readKeys = new Set(reads.map(item => item.key))
  const result: { key: string; title: string; message: string; href: string; read: boolean; priority: string }[] = []
  const add = (key: string, title: string, message: string, href: string, priority: string) => result.push({ key, title, message, href, priority, read: readKeys.has(key) })
  if (prefs.estoque) for (const item of ammo) add(`estoque:${item.id}:${item.updatedAt.toISOString()}`, 'Estoque baixo', `${item.tipo} ${item.calibre}: ${item.quantidade} unidades.`, '/municoes', 'warning')
  for (const item of arms) {
    const age = (Date.now() - (item.dataManutencao || item.dataAquisicao).getTime()) / 86400000
    if (prefs.manutencao && (item.status === 'MANUTENCAO' || age >= config.diasManutencao)) add(`manutencao:${item.id}:${item.updatedAt.toISOString()}`, item.status === 'MANUTENCAO' ? 'Em manutenção' : 'Revisão necessária', `${item.tipo} ${item.numSerie} — ${item.local}.`, '/armamentos', 'critical')
    const last = item.movements[0]
    if (prefs.devolucao && item.status === 'USO' && last && (Date.now() - last.data.getTime()) / 86400000 >= config.prazoDevolucao) add(`devolucao:${last.id}`, 'Devolução atrasada', `${item.numSerie} — ${last.responsible?.nome || 'Responsável não informado'}.`, '/movimentacoes', 'critical')
  }
  return result
}

export async function dashboard(userId: string) {
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0); start.setUTCMonth(start.getUTCMonth() - 5)
  const [total, uso, manutencao, estoque, ammunition, movements, recent, alerts] = await Promise.all([
    prisma.armament.count(), prisma.armament.count({ where: { status: 'USO' } }), prisma.armament.count({ where: { status: 'MANUTENCAO' } }), prisma.armament.count({ where: { status: 'ESTOQUE' } }),
    prisma.ammunition.aggregate({ _sum: { quantidade: true } }),
    prisma.movement.findMany({ where: { data: { gte: start } }, select: { data: true, tipo: true } }),
    prisma.movement.findMany({ orderBy: { data: 'desc' }, take: 5, include: { armament: true, ammunition: true, responsible: true } }), notifications(userId),
  ])
  const chart = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(start); date.setUTCMonth(start.getUTCMonth() + index)
    const rows = movements.filter(row => row.data.getUTCFullYear() === date.getUTCFullYear() && row.data.getUTCMonth() === date.getUTCMonth())
    return { name: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }), retiradas: rows.filter(row => row.tipo === 'RETIRADA').length, devolucoes: rows.filter(row => row.tipo === 'DEVOLUCAO').length }
  })
  return { total, uso, manutencao, estoque, municoes: ammunition._sum.quantidade || 0, chart, recent, alerts }
}
