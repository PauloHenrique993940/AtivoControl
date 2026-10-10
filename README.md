# AtivoControl

Gestão de armamentos, munições, responsáveis e movimentações com React, Express, Prisma e PostgreSQL no Neon.

[Aplicação online](https://ativocontrol.vercel.app) · [Swagger](https://ativocontrol.vercel.app/api/docs) · [OpenAPI](https://ativocontrol.vercel.app/api/openapi.json)

![Painel central](docs/media/02-dashboard.png)

Indicadores, gráficos e alertas são calculados a partir dos registros do Neon. A identidade visual SSP/BA não comprova vínculo ou homologação institucional.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Guia e galeria](docs/GUIA.md) | Prints completos, instruções e vídeos. |
| [Mapas](docs/ARQUITETURA.md) | Produção, Docker, navegação e dados. |
| [API](docs/API.md) | Endpoints, autenticação e exemplos. |
| [Operação](docs/OPERACAO.md) | Instalação, Neon, Docker e Vercel. |

## Vídeos

[![Tour da aplicação](docs/media/02-dashboard.png)](docs/media/tour-aplicacao.webm)

[Assistir/baixar tour da aplicação](https://raw.githubusercontent.com/PauloHenrique993940/AtivoControl/main/docs/media/tour-aplicacao.webm) · [Assistir/baixar tour do Swagger](https://raw.githubusercontent.com/PauloHenrique993940/AtivoControl/main/docs/media/tour-swagger.webm)

Gravações reais WebM, sem narração e sem senhas ou tokens visíveis. No GitHub, use **View raw/Download** se o player não aparecer.

## Galeria

| Login | Armamentos |
| --- | --- |
| ![Login](docs/media/01-login.png) | ![Armamentos](docs/media/03-armamentos.png) |
| **Munições** | **Movimentações** |
| ![Munições](docs/media/04-municoes.png) | ![Movimentações](docs/media/06-movimentacoes.png) |
| **Responsáveis** | **Swagger** |
| ![Responsáveis](docs/media/05-responsaveis.png) | ![Swagger](docs/media/09-swagger.png) |

As dez capturas completas estão no [guia](docs/GUIA.md).

## Arquitetura

```mermaid
flowchart LR
  subgraph client ["Cliente"]
    browser["Navegador"]
  end
  subgraph gateway ["Vercel"]
    frontend["React e Vite"]
  end
  subgraph service ["API"]
    api["Express - JWT - Prisma"]
  end
  subgraph datastore ["Banco"]
    neon[("Neon PostgreSQL")]
  end
  browser -->|"HTTPS"| frontend
  frontend -->|"/api - JSON e JWT"| api
  api -->|"PostgreSQL com pooling e TLS"| neon
```

Veja os [mapas completos](docs/ARQUITETURA.md), incluindo as relações entre tabelas.

## Executar localmente

Use Node.js 22 ou superior compatível e npm. Copie `backend/.env.example` para `backend/.env` e configure URLs Neon, `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

```sh
npm ci
npm run db:deploy
npm run db:seed --workspace backend
```

Em terminais separados:

```sh
npm run dev --workspace backend
npm run dev --workspace frontend
```

Frontend em `http://localhost:5173`; Swagger em `http://localhost:3333/docs`. No PowerShell com scripts bloqueados, use `npm.cmd` e `npx.cmd`.

## Docker

Com Docker Desktop ativo e `backend/.env` configurado:

```sh
docker compose build
docker compose run --rm api npm run db:deploy
docker compose run --rm api npm run db:seed --workspace backend
docker compose up -d
```

Frontend: `http://localhost:8080`. Swagger: `http://localhost:8080/api/docs`. O banco permanece no Neon.

## Vercel

Publique a raiz com `vercel.json`. Configure `DATABASE_URL`, `DIRECT_URL` e `JWT_SECRET` na Vercel. `CORS_ORIGIN` permite clientes em outra origem; `VITE_API_URL` substitui `/api` no build do frontend.

```sh
npm run build
npx vercel --prod
```

Aplique migrações antes de publicar alterações de schema. Builds não executam migrações ou seed. Detalhes em [operação](docs/OPERACAO.md).

## Estado atual

- Login JWT, sessão preservada após recarga, perfil e alteração de senha com revogação das sessões anteriores.
- Cadastro, edição, detalhes, busca, paginação e exclusão de armamentos, munições e responsáveis. Registros com movimentações são preservados.
- Retirada, devolução, manutenção e transferência de armamentos; retirada e devolução de munições com quantidade e saldo por responsável.
- Movimentação, estoque/status e auditoria são gravados na mesma transação, com proteção contra retiradas simultâneas.
- Painel, alertas e busca global usam dados reais; alertas lidos e preferências pessoais são persistidos.
- Unidade e parâmetros de estoque, manutenção e devolução são salvos no banco.
- Relatórios PDF e Excel, filtros por período e auditoria paginada.
- Gestão de usuários, ativação/desativação e permissões de administrador, gestor, operador e auditor.
- Navegação disponível também no menu para celular.
- Dados dos arquivos SQLite antigos não foram importados para o PostgreSQL.

Com Docker Desktop ativo, execute `npm test` para preparar um PostgreSQL isolado, compilar e testar a API. Os testes não usam o Neon de produção. Há também testes de navegação em `tests/browser.cjs`; consulte [verificações e operação](docs/OPERACAO.md).
