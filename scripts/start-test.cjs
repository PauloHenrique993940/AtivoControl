const fs = require('node:fs')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync('.tmp/test.env'))
if (new URL(env.DATABASE_URL).hostname !== 'localhost') throw Error('Use somente o banco local isolado.')
Object.assign(process.env, env)
process.env.CORS_ORIGIN = 'http://127.0.0.1:5174'
const app = require('../backend/dist/server').default
app.listen(3334, '127.0.0.1', () => console.log('API de testes em http://127.0.0.1:3334'))
