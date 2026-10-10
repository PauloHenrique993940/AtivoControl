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

Nesta instalação: banco `ativocontrol-db`, plano gratuito, São Paulo. A migração inicial cria seis tabelas; as migrações seguintes acrescentam configurações, alertas lidos, preferências, versão de sessão, quantidade/destino de movimentos e proteção dos vínculos históricos. A ampliação de inventário acrescenta coletes e o vínculo opcional de movimentação com colete; os cadastros existentes são preservados. Cadastro em lote e entrada de munição usam as tabelas de armamentos e movimentações existentes. Para alterações, use banco/branch de desenvolvimento e execute `npx prisma migrate dev --name nome_da_alteracao` em `backend`. Revise o SQL antes de aplicar `npm run db:deploy` ao destino. Não use reset em produção.

SQLite antigo foi preservado localmente, sem importação automática para o Neon. Uma transferência exige importação específica e revisão dos vínculos.

## Vercel

Publique a raiz com `vercel.json`. Configure `DATABASE_URL`, `DIRECT_URL` e `JWT_SECRET`. A integração Neon fornece `DATABASE_URL_UNPOOLED`, cujo valor pode ser usado em `DIRECT_URL`.

```sh
npx vercel link
npx vercel --prod
```

Frontend estático e função Node para API. Docker oferece execução alternativa local. Banco em São Paulo; a função segue a região da Vercel. Builds não alteram o banco ou criam usuários. O projeto está vinculado ao GitHub; pushes podem iniciar deploy automático.

## Verificações e limites

Os testes automatizados cobrem migração, preservação de usuário, CRUD, validação, concorrência de retirada de armas/munições, rollback de falhas, saldo de devolução, auditoria, configurações, alertas, busca, papéis, desativação, senha e revogação de tokens. Cadastro em lote verifica quantidades, identificação única e rollback integral; coletes verificam tamanho, datas, retirada/devolução, responsável e preservação do histórico. Entrada de munição verifica soma concorrente, permissão, limite inteiro e separação do saldo do responsável. PDF é validado pelo formato e Excel é aberto com ExcelJS, incluindo inventário de coletes.

Com Docker Desktop ativo:

```sh
npm test
```

O script cria/reutiliza `ativocontrol-test-db`, porta 55432, banco `ativocontrol_test`, com credenciais aleatórias em `.tmp/test.env`. Recusa URLs externas. A migração inicial é aplicada antes das novas e um usuário é inserido para verificar preservação. Fixtures ficam somente nesse banco isolado.

Para testes do navegador, após `npm test`, execute em terminais separados:

```sh
node scripts/start-test.cjs
```

```powershell
$env:VITE_API_URL='http://127.0.0.1:3334'
npm.cmd run dev --workspace frontend -- --host 127.0.0.1 --port 5174 --strictPort
```

```sh
npx playwright install chromium ffmpeg
npm run test:browser
```

Os testes de navegador cobrem login/recarga, cadastro/edição/detalhes/exclusão, lote de pistolas, coletes, entrada e retirada de munição, estoque, busca, configurações/preferências, alertas, downloads, usuários, senha, logout e menu móvel. As alterações de senha ocorrem somente no banco de teste e são revertidas ao final do fluxo bem-sucedido. Pare a API de teste antes de gerar Prisma no Windows para evitar bloqueio da DLL.

Dados SQLite antigos não são importados automaticamente. Não há envio de emails, upload de foto ou integração externa de assinatura; a interface não apresenta esses recursos como disponíveis. A auditoria é preservada, sem ações de apagar histórico ou resetar o banco. O limitador de login usa memória por instância; não é um limite global distribuído.

Dependências tiveram correções compatíveis aplicadas. Restam alertas que exigem mudanças de versão ou revisão de dependências transitivas; execute `npm audit` para consultar o estado do lockfile.
