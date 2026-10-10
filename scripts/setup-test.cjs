const fs = require('node:fs')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const dotenv = require('dotenv')
fs.mkdirSync('.tmp', { recursive: true })
const status = cp.spawnSync('docker', ['inspect', '--format', '{{.State.Running}}', 'ativocontrol-test-db'], { encoding: 'utf8' })
if (status.status === 0 && !fs.existsSync('.tmp/test.env')) throw Error('Container de teste existente sem .tmp/test.env. Recupere sua configuração antes de continuar.')
if (!fs.existsSync('.tmp/test.env')) {
  const password = crypto.randomBytes(24).toString('hex')
  const url = `postgresql://postgres:${password}@localhost:55432/ativocontrol_test`
  fs.writeFileSync('.tmp/test.env', `DATABASE_URL=${url}\nDIRECT_URL=${url}\nJWT_SECRET=${crypto.randomBytes(48).toString('hex')}\nPORT=3334\nADMIN_EMAIL=test-admin@example.com\nADMIN_PASSWORD=${crypto.randomBytes(24).toString('hex')}\n`)
}
const env = dotenv.parse(fs.readFileSync('.tmp/test.env'))
const url = new URL(env.DATABASE_URL)
if (url.hostname !== 'localhost' || url.port !== '55432' || url.pathname !== '/ativocontrol_test') throw Error('Configuração deve apontar exclusivamente ao banco local isolado.')
if (status.status !== 0) {
  const result = cp.spawnSync('docker', ['run', '--detach', '--name', 'ativocontrol-test-db', '-p', '55432:5432', '-e', 'POSTGRES_PASSWORD=' + url.password, '-e', 'POSTGRES_DB=ativocontrol_test', 'postgres:17-alpine'], { encoding: 'utf8' })
  if (result.status !== 0) throw Error(result.stderr)
} else if (status.stdout.trim() !== 'true') {
  cp.execFileSync('docker', ['start', 'ativocontrol-test-db'], { stdio: 'pipe' })
}
async function ready() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const result = cp.spawnSync('docker', ['exec', 'ativocontrol-test-db', 'pg_isready', '-U', 'postgres'], { stdio: 'pipe' })
    if (result.status === 0) { console.log('Banco local de testes pronto em localhost:55432.'); return }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw Error('Banco de testes não iniciou.')
}
ready().catch(error => { console.error(error.message); process.exitCode = 1 })
