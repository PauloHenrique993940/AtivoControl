import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { movementSchema, HttpError, transaction, audit } from '../lib/domain'

export const movementInclude = { armament: true, ammunition: true, responsible: true, user: { select: { name: true } } } as const

export async function registerMovement(userId: string, input: z.infer<typeof movementSchema>) {
  if (Boolean(input.armamentId) === Boolean(input.ammunitionId)) throw new HttpError(400, 'Selecione um armamento ou uma munição.')
  if ((input.tipo === 'RETIRADA' || input.tipo === 'DEVOLUCAO') && !input.responsibleId) throw new HttpError(400, 'Selecione o responsável.')
  if (input.tipo === 'TRANSFERENCIA' && !input.destino?.trim()) throw new HttpError(400, 'Informe o local de destino.')
  return transaction(async tx => {
    if (input.responsibleId && !await tx.responsible.findUnique({ where: { id: input.responsibleId } })) throw new HttpError(404, 'Responsável não encontrado.')
    if (input.armamentId) {
      const armament = await tx.armament.findUnique({ where: { id: input.armamentId } })
      if (!armament) throw new HttpError(404, 'Armamento não encontrado.')
      const last = await tx.movement.findFirst({ where: { armamentId: armament.id }, orderBy: [{ data: 'desc' }, { createdAt: 'desc' }] })
      let data: Prisma.ArmamentUpdateInput = {}
      if (input.tipo === 'RETIRADA') {
        if (armament.status !== 'ESTOQUE') throw new HttpError(409, 'Armamento indisponível para retirada.')
        data = { status: 'USO' }
      } else if (input.tipo === 'DEVOLUCAO') {
        if (armament.status !== 'USO' && armament.status !== 'MANUTENCAO') throw new HttpError(409, 'Armamento não está em uso ou manutenção.')
        if (armament.status === 'USO' && last?.responsibleId && last.responsibleId !== input.responsibleId) throw new HttpError(409, 'Devolução deve indicar o responsável pela retirada.')
        data = { status: 'ESTOQUE', ...(armament.status === 'MANUTENCAO' ? { dataManutencao: new Date() } : {}) }
      } else if (input.tipo === 'MANUTENCAO') {
        if (armament.status !== 'ESTOQUE') throw new HttpError(409, 'Somente armamento em estoque pode ser enviado à manutenção.')
        data = { status: 'MANUTENCAO' }
      } else {
        if (armament.status !== 'ESTOQUE') throw new HttpError(409, 'Somente armamento em estoque pode ser transferido.')
        data = { local: input.destino! }
      }
      if (input.quantidade) throw new HttpError(400, 'Quantidade é usada somente para munições.')
      await tx.armament.update({ where: { id: armament.id }, data })
    } else {
      if (input.tipo !== 'RETIRADA' && input.tipo !== 'DEVOLUCAO') throw new HttpError(400, 'Munições permitem retirada ou devolução.')
      if (!input.quantidade) throw new HttpError(400, 'Informe a quantidade de munições.')
      const ammunition = await tx.ammunition.findUnique({ where: { id: input.ammunitionId! } })
      if (!ammunition) throw new HttpError(404, 'Munição não encontrada.')
      if (input.tipo === 'RETIRADA') {
        const result = await tx.ammunition.updateMany({ where: { id: ammunition.id, quantidade: { gte: input.quantidade } }, data: { quantidade: { decrement: input.quantidade } } })
        if (!result.count) throw new HttpError(409, 'Estoque insuficiente.')
      } else {
        const totals = await tx.movement.groupBy({ by: ['tipo'], where: { ammunitionId: ammunition.id, responsibleId: input.responsibleId }, _sum: { quantidade: true } })
        const outstanding = totals.reduce((sum, row) => sum + (row.tipo === 'RETIRADA' ? 1 : -1) * (row._sum.quantidade || 0), 0)
        if (input.quantidade > outstanding) throw new HttpError(409, 'Quantidade supera o saldo retirado por este responsável.')
        await tx.ammunition.update({ where: { id: ammunition.id }, data: { quantidade: { increment: input.quantidade } } })
      }
    }
    const movement = await tx.movement.create({ data: { ...input, userId }, include: movementInclude })
    await audit(tx, userId, `MOVIMENTACAO_${input.tipo}`, JSON.stringify({ id: movement.id, ...input }))
    return movement
  })
}
