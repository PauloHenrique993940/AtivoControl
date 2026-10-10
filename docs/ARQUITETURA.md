# Mapas da arquitetura

[README](../README.md) · [Operação](OPERACAO.md)

## Produção

```mermaid
flowchart LR
  subgraph client ["Cliente"]
    browser["Navegador"]
  end
  subgraph gateway ["Vercel"]
    frontend["React e Vite - arquivos estáticos"]
  end
  subgraph service ["API"]
    api["Função Express - JWT - Prisma"]
  end
  subgraph datastore ["Banco"]
    neon[("Neon PostgreSQL - São Paulo")]
  end
  browser -->|"HTTPS"| frontend
  frontend -->|"/api - JSON e JWT"| api
  api -->|"DATABASE_URL - pooling e TLS"| neon
```

A Vercel serve `frontend/dist` e encaminha `/api/*` para `api/index.ts`. O backend remove o prefixo antes de executar as rotas. URLs da interface usam fallback de SPA. Prisma usa `DATABASE_URL` para consultas e `DIRECT_URL` para migrações. Builds não alteram o banco.

## Docker

![Mapa](media/mapa-docker.png)

[Vers?o vetorial SVG](media/mapa-docker.svg)

```mermaid
flowchart LR
  subgraph client ["Cliente local"]
    browser["Navegador - localhost:8080"]
  end
  subgraph gateway ["Container web"]
    nginx["Nginx - frontend compilado"]
  end
  subgraph service ["Container api"]
    express["Node e Express - porta 3333"]
  end
  subgraph datastore ["Banco externo"]
    neon[("Neon PostgreSQL")]
  end
  browser -->|"HTTP"| nginx
  nginx -->|"Proxy /api/ para api:3333"| express
  express -->|"PostgreSQL com TLS"| neon
```

O Compose não cria PostgreSQL local. A API recebe `backend/.env`; o Nginx faz proxy para `api`. Healthcheck consulta `/health`. Na porta direta 3333, as rotas não precisam de `/api`.

## Navegação

```mermaid
flowchart LR
  login["Login"] --> panel["Painel central"]
  panel --> weapons["Armamentos"]
  panel --> ammo["Munições"]
  panel --> people["Responsáveis"]
  panel --> movements["Movimentações"]
  panel --> reports["Relatórios"]
  panel --> settings["Configurações"]
```

## Dados

![Mapa](media/mapa-dados.png)

[Vers?o vetorial SVG](media/mapa-dados.svg)

```mermaid
erDiagram
  User ||--o{ Movement : registra
  User ||--o{ AuditLog : possui
  User ||--o{ NotificationRead : le
  Armament |o--o{ Movement : associado
  Ammunition |o--o{ Movement : associada
  Responsible |o--o{ Movement : associado
  User {
    string id PK
    string email UK
    string password
    string role
    boolean active
    int tokenVersion
    json preferences
  }
  Armament {
    string id PK
    string numSerie UK
    string numRegistro UK
    string status
  }
  Ammunition {
    string id PK
    string tipo
    string calibre
    int quantidade
  }
  Responsible {
    string id PK
    string identificacaoFuncional UK
    string nome
    string setor
  }
  Movement {
    string id PK
    string userId FK
    string armamentId FK
    string ammunitionId FK
    string responsibleId FK
    string tipo
    int quantidade
    string destino
    datetime data
  }
  AuditLog {
    string id PK
    string userId FK
    string acao
    string detalhes
    datetime data
  }
  SystemSettings {
    string id PK
    json data
    datetime updatedAt
  }
  NotificationRead {
    string userId PK,FK
    string key PK
    datetime readAt
  }
```

Todo movimento tem usuário; os demais vínculos são opcionais. Senhas são hashes bcrypt. Tipo, status e papel são strings, sem enum no banco. Veja o [schema completo](../backend/prisma/schema.prisma).

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `api/index.ts` | Entrada da função Vercel. |
| `backend/server.ts` | Express, Swagger e saúde. |
| `backend/routes/`, `services/`, `middlewares/` | Endpoints, regras de negócio e JWT. |
| `backend/lib/domain.ts` | Validação, transações, permissões e erros. |
| `backend/prisma/` | Schema, migrações e seed. |
| `backend/docs/openapi.ts` | Especificação OpenAPI. |
| `frontend/src/pages/` | Telas. |
| `frontend/src/context/`, `services/` | Sessão e Axios. |
| `docs/media/`, `scripts/capture-docs.cjs` | Capturas e gravação reproduzível. |
| `Dockerfile`, `frontend/Dockerfile`, `compose.yaml` | Containers. |
| `vercel.json` | Build e rotas publicadas. |
