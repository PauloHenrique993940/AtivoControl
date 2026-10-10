import 'dotenv/config'
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) throw new Error('Configure ADMIN_EMAIL e ADMIN_PASSWORD (minimo 12 caracteres)')
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL,
      name: 'Administrador AtivoControl',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
