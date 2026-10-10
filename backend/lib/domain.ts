import { Prisma } from '@prisma/client'
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { z } from 'zod'
import prisma from './prisma'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export const route = (handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => { Promise.resolve(handler(req, res)).catch(next) }
export const roles = (...allowed: string[]): RequestHandler => (req, _res, next) => next(allowed.includes(req.userRole) ? undefined : new HttpError(403, 'Seu perfil não tem permissão para esta ação.'))
export const managers = ['ADMIN', 'GESTOR_ARMARIA']
export const operators = [...managers, 'OPERADOR']
export const userSelect = { id: true, name: true, email: true, role: true, active: true, preferences: true, createdAt: true, updatedAt: true } as const
export const text = z.string().trim().min(1, 'Campo obrigatório').max(200)
export const optionalText = z.string().trim().max(2000).optional().nullable()
export const idSchema = z.string().uuid('Identificador inválido')
export function id(req: Request) { return idSchema.parse(req.params.id) }
export const statuses = ['ESTOQUE', 'USO', 'MANUTENCAO', 'BLOQUEADA', 'BAIXADA'] as const
export const roleNames = ['ADMIN', 'GESTOR_ARMARIA', 'OPERADOR', 'AUDITOR'] as const
export const armamentSchema = z.object({ tipo: text, marca: text, modelo: text, calibre: text, numSerie: text, numRegistro: text, dataAquisicao: z.coerce.date().default(() => new Date()), local: text.default('Armaria Central'), status: z.enum(statuses).default('ESTOQUE'), observacoes: optionalText, dataManutencao: z.coerce.date().nullable().optional() }).strict()
export const ammunitionSchema = z.object({ tipo: text, calibre: text, quantidade: z.coerce.number().int().min(0).max(2147483647).default(0) }).strict()
export const responsibleSchema = z.object({ nome: text, identificacaoFuncional: text, setor: text }).strict()
export const settingsSchema = z.object({ unidade: text.default('AtivoControl'), sigla: text.default('ATIVO'), endereco: z.string().trim().max(300).default(''), telefone: z.string().trim().max(40).default(''), baixoEstoque: z.coerce.number().int().min(0).max(1000000).default(100), prazoDevolucao: z.coerce.number().int().min(1).max(365).default(7), diasManutencao: z.coerce.number().int().min(1).max(3650).default(180) }).strict()
export const preferencesSchema = z.object({ manutencao: z.boolean().default(true), estoque: z.boolean().default(true), devolucao: z.boolean().default(true) }).strict()
export const movementSchema = z.object({ tipo: z.enum(['RETIRADA', 'DEVOLUCAO', 'TRANSFERENCIA', 'MANUTENCAO']), motivo: z.string().trim().min(1).max(2000), armamentId: idSchema.optional().nullable(), ammunitionId: idSchema.optional().nullable(), responsibleId: idSchema.optional().nullable(), quantidade: z.coerce.number().int().min(1).max(2147483647).optional(), destino: optionalText }).strict()

export async function transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 15000 }) }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 3) continue
      throw error
    }
  }
}
export function audit(tx: Prisma.TransactionClient, userId: string, acao: string, detalhes: string) { return tx.auditLog.create({ data: { userId, acao, detalhes } }) }
export async function settings() { const value = await prisma.systemSettings.findUnique({ where: { id: 'global' } }); return settingsSchema.parse(value?.data || {}) }
export function dateFilter(req: Request) {
  const schema = z.object({ inicio: z.iso.date().optional(), fim: z.iso.date().optional() })
  const { inicio, fim } = schema.parse(req.query)
  if (inicio && fim && inicio > fim) throw new HttpError(400, 'Data inicial deve ser anterior à final.')
  return { ...(inicio ? { gte: new Date(`${inicio}T00:00:00-03:00`) } : {}), ...(fim ? { lt: new Date(new Date(`${fim}T00:00:00-03:00`).getTime() + 86400000) } : {}) }
}
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return _next(error)
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message })
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') })
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Já existe um registro com esta identificação.' })
    if (error.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' })
    if (error.code === 'P2003') return res.status(409).json({ error: 'Registro possui histórico e não pode ser excluído.' })
    if (error.code === 'P2034') return res.status(409).json({ error: 'Outro usuário alterou este registro. Atualize e tente novamente.' })
  }
  if (error instanceof SyntaxError) return res.status(400).json({ error: 'JSON inválido.' })
  console.error(error)
  return res.status(500).json({ error: 'Não foi possível concluir a operação.' })
}
