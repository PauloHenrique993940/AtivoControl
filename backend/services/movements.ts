import { z } from 'zod'
import { movementSchema, HttpError, transaction, audit } from '../lib/domain'

export const movementInclude = { armament: true, ammunition: true, vest: true, responsible: true, user: { select: { name: true } } } as const

export async function registerMovement(userId: string, input: z.infer<typeof movementSchema>) {
  if ([input.armamentId, input.ammunitionId, input.vestId].filter(Boolean).length !== 1) throw new HttpError(400, 'Selecione exatamente um armamento, uma munição ou um colete.')
  if ((input.tipo === 'RETIRADA' || input.tipo === 'DEVOLUCAO') && !input.responsibleId) throw new HttpError(400, 'Selecione o responsável.')
  if (input.tipo === 'TRANSFERENCIA' && !input.destino?.trim()) throw new HttpError(400, 'Informe o local de destino.')
  return transaction(async tx => {
    if (input.responsibleId && !await tx.responsible.findUnique({ where: { id: input.responsibleId } })) throw new HttpError(404, 'Responsável não encontrado.')
    if (input.armamentId || input.vestId) {
      if (input.tipo === 'ENTRADA') throw new HttpError(400, 'Entrada por quantidade é usada somente para munições. Cadastre as unidades do ativo.')
      const asset = input.armamentId ? await tx.armament.findUnique({ where: { id: input.armamentId } }) : await tx.vest.findUnique({ where: { id: input.vestId! } })
      const label = input.armamentId ? 'Armamento' : 'Colete'
      if (!asset) throw new HttpError(404, `${label} não encontrado.`)
      const last = await tx.movement.findFirst({ where: input.armamentId ? { armamentId: asset.id } : { vestId: asset.id }, orderBy: [{ data: 'desc' }, { createdAt: 'desc' }] })
      let data: { status?: string; local?: string; dataManutencao?: Date } = {}
      if (input.tipo === 'RETIRADA') {
        if (asset.status !== 'ESTOQUE') throw new HttpError(409, `${label} indisponível para retirada.`)
        if (input.vestId && 'dataValidade' in asset && asset.dataValidade) {
          const today = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10)
          if (asset.dataValidade.toISOString().slice(0, 10) < today) throw new HttpError(409, 'Colete com validade vencida. Retirada não permitida.')
        }
        data = { status: 'USO' }
      } else if (input.tipo === 'DEVOLUCAO') {
        if (asset.status !== 'USO' && asset.status !== 'MANUTENCAO') throw new HttpError(409, `${label} não está em uso ou manutenção.`)
        if (asset.status === 'USO' && last?.responsibleId && last.responsibleId !== input.responsibleId) throw new HttpError(409, 'Devolução deve indicar o responsável pela retirada.')
        data = { status: 'ESTOQUE', ...(asset.status === 'MANUTENCAO' ? { dataManutencao: new Date() } : {}) }
      } else if (input.tipo === 'MANUTENCAO') {
        if (asset.status !== 'ESTOQUE') throw new HttpError(409, `Somente ${label.toLowerCase()} em estoque pode ser enviado à manutenção.`)
        data = { status: 'MANUTENCAO' }
      } else {
        if (asset.status !== 'ESTOQUE') throw new HttpError(409, `Somente ${label.toLowerCase()} em estoque pode ser transferido.`)
        data = { local: input.destino! }
      }
      if (input.quantidade !== undefined) throw new HttpError(400, 'Quantidade é usada somente para munições. Movimente uma unidade identificada do ativo.')
      if (input.armamentId) await tx.armament.update({ where: { id: asset.id }, data })
      else await tx.vest.update({ where: { id: asset.id }, data })
    } else {
      if (!['RETIRADA', 'DEVOLUCAO', 'ENTRADA'].includes(input.tipo)) throw new HttpError(400, 'Munições permitem entrada, retirada ou devolução.')
      if (!input.quantidade) throw new HttpError(400, 'Informe a quantidade de munições.')
      const ammunition = await tx.ammunition.findUnique({ where: { id: input.ammunitionId! } })
      if (!ammunition) throw new HttpError(404, 'Munição não encontrada.')
      if (input.tipo === 'RETIRADA') {
        const result = await tx.ammunition.updateMany({ where: { id: ammunition.id, quantidade: { gte: input.quantidade } }, data: { quantidade: { decrement: input.quantidade } } })
        if (!result.count) throw new HttpError(409, 'Estoque insuficiente.')
      } else {
        if (input.tipo === 'DEVOLUCAO') {
          const totals = await tx.movement.groupBy({ by: ['tipo'], where: { ammunitionId: ammunition.id, responsibleId: input.responsibleId, tipo: { in: ['RETIRADA', 'DEVOLUCAO'] } }, _sum: { quantidade: true } })
          const outstanding = totals.reduce((sum, row) => sum + (row.tipo === 'RETIRADA' ? 1 : -1) * (row._sum.quantidade || 0), 0)
          if (input.quantidade > outstanding) throw new HttpError(409, 'Quantidade supera o saldo retirado por este responsável.')
        }
        const result = await tx.ammunition.updateMany({ where: { id: ammunition.id, quantidade: { lte: 2147483647 - input.quantidade } }, data: { quantidade: { increment: input.quantidade } } })
        if (!result.count) throw new HttpError(409, 'Quantidade supera o limite do estoque.')
      }
    }
    const movement = await tx.movement.create({ data: { ...input, userId }, include: movementInclude })
    await audit(tx, userId, `MOVIMENTACAO_${input.tipo}`, JSON.stringify({ id: movement.id, ...input }))
    return movement
  })
}
