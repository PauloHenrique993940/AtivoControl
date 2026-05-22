import express from 'express'
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

app.use(cors())
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor AtivoControl rodando em http://localhost:${PORT}`)
})
