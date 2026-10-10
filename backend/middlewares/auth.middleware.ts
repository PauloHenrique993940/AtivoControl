import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import prisma from '../lib/prisma'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '')
  if (!match) return res.status(401).json({ error: 'Token não fornecido.' })
  let payload: JwtPayload
  try {
    const verified = jwt.verify(match[1], process.env.JWT_SECRET!, { algorithms: ['HS256'] })
    if (typeof verified === 'string' || typeof verified.id !== 'string') throw new Error()
    payload = verified
  } catch { return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' }) }
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user?.active || user.tokenVersion !== (payload.version ?? 0)) return res.status(401).json({ error: 'Sessão encerrada. Entre novamente.' })
    req.userId = user.id
    req.userRole = user.role
    next()
  } catch (error) { next(error) }
}
