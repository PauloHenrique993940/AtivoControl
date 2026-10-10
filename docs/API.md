# API

[README](../README.md) · [Swagger](https://ativocontrol.vercel.app/api/docs) · [OpenAPI](https://ativocontrol.vercel.app/api/openapi.json)

Base: `https://ativocontrol.vercel.app/api`. Docker: `http://localhost:8080/api`. Backend direto: `http://localhost:3333`, sem `/api`.

| Método | Caminho | Autenticação | Resultado |
| --- | --- | --- | --- |
| GET | `/health` | Pública | Conexão com banco. |
| POST | `/auth/login` | Pública | Usuário sem senha e JWT. |
| GET | `/armamentos` | JWT | Lista, mais recentes primeiro. |
| GET | `/armamentos/{id}` | JWT | Dossiê e histórico do armamento. |
| POST | `/armamentos` | JWT | Cria armamento. |
| PUT | `/armamentos/{id}` | JWT | Atualiza armamento. |
| DELETE | `/armamentos/{id}` | JWT | Exclui armamento. |
| GET | `/municoes` | JWT | Lista por tipo. |
| POST | `/municoes` | JWT | Cria munição. |
| GET | `/municoes/{id}` | JWT | Detalhes e histórico. |
| PUT | `/municoes/{id}` | JWT | Atualiza cadastro/quantidade com auditoria. |
| DELETE | `/municoes/{id}` | JWT | Exclui somente sem movimentações. |
| GET | `/responsaveis` | JWT | Lista por nome. |
| POST | `/responsaveis` | JWT | Cria responsável. |
| GET | `/responsaveis/{id}` | JWT | Detalhes e histórico. |
| PUT | `/responsaveis/{id}` | JWT | Atualiza cadastro. |
| DELETE | `/responsaveis/{id}` | JWT | Exclui somente sem movimentações. |
| GET | `/movimentacoes` | JWT | Lista com armamento, responsável e nome do usuário. |
| POST | `/movimentacoes` | JWT | Registra movimento. |
| GET | `/docs` | Pública | Swagger. |
| GET | `/openapi.json` | Pública | OpenAPI 3.0.3. |
| GET | `/auth/me` | JWT | Sessão atual. |
| PUT | `/auth/profile` | JWT | Nome e email. |
| PUT | `/auth/password` | JWT | Altera senha e retorna novo JWT. |
| PUT | `/auth/preferences` | JWT | Preferências de alertas. |
| POST | `/auth/logout` | JWT | Encerra sessões. |
| GET | `/dashboard` | JWT | Indicadores, gráfico, alertas e histórico recente. |
| GET | `/search?term=texto` | JWT | Busca global; mínimo de dois caracteres. |
| GET | `/settings` | JWT | Unidade e parâmetros. |
| PUT | `/settings` | Administrador | Salva configurações globais. |
| GET | `/notifications` | JWT | Alertas e estado de leitura. |
| POST | `/notifications/read` | JWT | Marca chaves como lidas. |
| GET | `/audit` | Admin/gestor/auditor | Auditoria paginada. |
| GET | `/reports/{tipo}/pdf` | JWT | PDF real; auditoria indisponível para operador. |
| GET | `/reports/{tipo}/xlsx` | JWT | Excel real; mesma autorização do PDF. |
| GET | `/users` | Administrador | Usuários sem senha. |
| POST | `/users` | Administrador | Cria conta e papel. |
| PUT | `/users/{id}` | Administrador | Nome, papel e ativação. |

## Autenticação

```http
POST /api/auth/login
Content-Type: application/json

{"email":"seu-email@example.com","password":"sua-senha"}
```

O sucesso retorna `{ "user": { ... }, "token": "JWT" }`. Use `Authorization: Bearer JWT`. O token expira em um dia; conta, papel e versão da sessão são verificados no banco a cada requisição. Administrador tem acesso completo; gestor altera cadastros e opera; operador registra movimentações; auditor consulta e exporta relatórios. Alterações de senha, papel ou ativação revogam sessões anteriores.

## Exemplos de criação

Exemplos abaixo não foram inseridos no banco para produzir a documentação.

### Armamento

```json
{
  "tipo":"Pistola", "marca":"Marca de exemplo", "modelo":"Modelo de exemplo",
  "calibre":"9mm", "numSerie":"DEMO-SERIE-001", "numRegistro":"DEMO-REGISTRO-001",
  "dataAquisicao":"2026-10-10T12:00:00.000Z", "local":"Armaria Central", "status":"ESTOQUE"
}
```

Tipo, marca, modelo, calibre, série e registro são obrigatórios. PUT atualiza somente campos enviados, incluindo local, aquisição, observações e última manutenção. Status de uso/manutenção é alterado exclusivamente por movimentação. Datas inválidas e status desconhecidos são rejeitados.

### Munição

```json
{"tipo":"Treinamento","calibre":"9mm","quantidade":100}
```

Tipo e calibre obrigatórios; quantidade omitida recebe zero. Quantidade deve ser inteira e não negativa. PUT ajusta o cadastro; DELETE somente sem histórico.

### Responsável

```json
{"nome":"Pessoa de exemplo","identificacaoFuncional":"DEMO-001","setor":"Treinamento"}
```

Todos obrigatórios. PUT altera dados enviados; DELETE somente sem histórico.

### Movimentação

```json
{"tipo":"RETIRADA","motivo":"Exemplo","armamentId":"uuid-do-armamento","responsibleId":"uuid-do-responsavel"}
```

Tipo e motivo obrigatórios; autor vem do JWT. Informe exatamente um entre `armamentId` e `ammunitionId`, com UUID válido. Retirada/devolução exigem `responsibleId`. Retirada muda status para `USO`, devolução para `ESTOQUE`; manutenção/transferência somente partem de estoque. Transferência exige `destino`.

Para munição, informe `quantidade` inteira positiva. Somente retirada/devolução são aceitas; retirada desconta estoque e devolução é limitada ao saldo daquele responsável. Criação do movimento, atualização do ativo e auditoria ocorrem na mesma transação serializável, com repetição em conflitos de concorrência.

## Respostas

200 para consultas/login/alteração/exclusão; 201 para criação; 400 para validação; 401 para sessão inválida; 403 para papel sem permissão; 404 para registro/rota inexistente; 409 para duplicidade, histórico, estoque ou estado incompatível; 429 para excesso de tentativas de login; 500 para falha interna.

Erros retornam `{ "error": "mensagem" }`. Saúde retorna `{ "status": "OK", "database": "Connected" }`, ou `Error`/`Disconnected` na falha. Cadastros/movimentos são paginados na interface; a API retorna listas. Auditoria é paginada na API, 30 eventos por página.

## Períodos, configurações e arquivos

`inicio` e `fim` usam `YYYY-MM-DD`, com limites de dia no fuso UTC−3; data final é inclusiva. Estão disponíveis em movimentações, auditoria e exportação de histórico. `/audit` também aceita `page` e `acao`. Relatórios aceitam os tipos `armamentos`, `municoes`, `responsaveis`, `movimentacoes` e `auditoria`. PDF usa `application/pdf`; Excel usa `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

`/settings` recebe `unidade`, `sigla`, `endereco`, `telefone`, `baixoEstoque`, `prazoDevolucao` e `diasManutencao`. `/auth/preferences` recebe os booleanos `manutencao`, `estoque`, `devolucao`. Para leitura de alertas, envie `{ "keys": ["chave-retornada-pela-api"] }` a `/notifications/read`.

Troca de senha recebe `currentPassword` e `newPassword`, mínimo de 12 caracteres, e retorna novo token. Criação de usuário recebe `name`, `email`, `role` e `password`; alteração recebe `name`, `role` e/ou `active`. O administrador não pode desativar ou rebaixar a própria conta.
