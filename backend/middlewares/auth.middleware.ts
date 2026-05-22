import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface TokenPayload {
  id: string
  role: string
  iat: number
  exp: number
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authorization.replace('Bearer', '').trim()

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const { id, role } = data as TokenPayload

    req.userId = id
    req.userRole = role

    return next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
