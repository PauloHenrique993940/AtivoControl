import 'dotenv/config'
import express from 'express'
import { openapi } from './docs/openapi'
import cors from 'cors'
import dotenv from 'dotenv'
import prisma from './lib/prisma'
import authRoutes from './routes/auth.routes'
import armamentRoutes from './routes/armament.routes'
import ammunitionRoutes from './routes/ammunition.routes'
import responsibleRoutes from './routes/responsible.routes'
import movementRoutes from './routes/movement.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3333

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET deve ser configurado')
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false }))
app.use(express.json())
app.use((req, _res, next) => {
  if (req.url === '/api' || req.url.startsWith('/api/')) req.url = req.url.slice(4) || '/'
  next()
})
app.get('/openapi.json', (_req, res) => res.json(openapi))
app.get('/docs', (_req, res) => res.type('html').send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>AtivoControl API</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.31.0/swagger-ui.css"></head>
<body><div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.31.0/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({spec:${JSON.stringify(openapi)},dom_id:'#swagger-ui',deepLinking:true})</script>
</body></html>`))

// Rotas
app.use('/auth', authRoutes)
app.use('/armamentos', armamentRoutes)
app.use('/municoes', ammunitionRoutes)
app.use('/responsaveis', responsibleRoutes)
app.use('/movimentacoes', movementRoutes)

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'OK', database: 'Connected' })
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' })
  }
})

if (require.main === module) app.listen(PORT, () => {
  console.log(`🚀 Servidor AtivoControl rodando em http://localhost:${PORT}`)
})

export default app
