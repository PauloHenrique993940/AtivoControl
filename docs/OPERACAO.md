# Instalação e operação

[README](../README.md) · [Mapas](ARQUITETURA.md)

## Variáveis

Use Node.js 22 ou superior compatível e npm. Copie `backend/.env.example` para `backend/.env`.

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | PostgreSQL com pooling para consultas. |
| `DIRECT_URL` | Conexão direta para migrações. |
| `JWT_SECRET` | Segredo aleatório obrigatório para JWT. |
| `CORS_ORIGIN` | Origens separadas por vírgula, quando necessário. |
| `PORT` | Porta da API, padrão 3333. |
| `ADMIN_EMAIL` | Email do seed. |
| `ADMIN_PASSWORD` | Senha inicial, mínimo 12 caracteres. |
| `VITE_API_URL` | URL opcional no build do frontend, padrão `/api`. |

URLs Neon usam `sslmode=require`. A conexão direta não usa hostname de pooling. Seed não substitui senhas existentes. Variáveis `ADMIN_*` não precisam ser publicadas na Vercel.

## Desenvolvimento

```sh
npm ci
npm run db:deploy
npm run db:seed --workspace backend
```

Em dois terminais: `npm run dev --workspace backend` e `npm run dev --workspace frontend`. Frontend em `http://localhost:5173`, backend em `http://localhost:3333`. Build: `npm run build`. No PowerShell com scripts bloqueados, use `npm.cmd` e `npx.cmd`.

## Docker

```sh
docker compose build
docker compose run --rm api npm run db:deploy
docker compose run --rm api npm run db:seed --workspace backend
docker compose up -d
docker compose ps
```

Frontend em `http://localhost:8080`; Swagger em `http://localhost:8080/api/docs`. Healthcheck consulta o banco a cada 30 segundos. Imagens não incluem segredos ou SQLite.

```sh
docker compose logs --tail 100 api
docker compose logs --tail 100 web
docker compose down
```

O banco remoto permanece após encerrar containers. A imagem API contém ferramentas de migração para execução explícita.

## Neon

Nesta instalação: banco `ativocontrol-db`, plano gratuito, São Paulo. A migração `20261010000000_init_postgresql` cria seis tabelas. Para alterações, use banco/branch de desenvolvimento e execute `npx prisma migrate dev --name nome_da_alteracao` em `backend`. Revise o SQL antes de aplicar `npm run db:deploy` ao destino. Não use reset em produção.

SQLite antigo foi preservado localmente, sem importação automática para o Neon. Uma transferência exige importação específica e revisão dos vínculos.

## Vercel

Publique a raiz com `vercel.json`. Configure `DATABASE_URL`, `DIRECT_URL` e `JWT_SECRET`. A integração Neon fornece `DATABASE_URL_UNPOOLED`, cujo valor pode ser usado em `DIRECT_URL`.

```sh
npx vercel link
npx vercel --prod
```

Frontend estático e função Node para API. Docker oferece execução alternativa local. Banco em São Paulo; a função segue a região da Vercel. Builds não alteram o banco ou criam usuários. O projeto está vinculado ao GitHub; pushes podem iniciar deploy automático.

## Verificações e limites

Verificados: compilação TypeScript/Vite, imagens e containers, saúde Neon, login, listagens autenticadas dos quatro módulos, rejeição sem token e Swagger. Capturas de 10/10/2026.

Não foram cobertos CRUD completo, concorrência ou autorização por papel. Não há suíte automatizada de testes de negócio. A instalação reportou 15 alertas de dependências: 5 moderados e 10 altos; atualização pendente.

Dashboard/alertas usam exemplos; configurações não persistem; PDF/Excel e auditoria automática estão pendentes. Movimento e alteração de status não são atômicos; estoque de munições não é descontado.
