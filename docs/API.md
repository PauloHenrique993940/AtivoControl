# API

[README](../README.md) · [Swagger](https://ativocontrol.vercel.app/api/docs) · [OpenAPI](https://ativocontrol.vercel.app/api/openapi.json)

Base: `https://ativocontrol.vercel.app/api`. Docker: `http://localhost:8080/api`. Backend direto: `http://localhost:3333`, sem `/api`.

| Método | Caminho | Autenticação | Resultado |
| --- | --- | --- | --- |
| GET | `/health` | Pública | Conexão com banco. |
| POST | `/auth/login` | Pública | Usuário sem senha e JWT. |
| GET | `/armamentos` | JWT | Lista, mais recentes primeiro. |
| GET | `/armamentos/{id}` | JWT | Dossiê e histórico do armamento. |
| POST | `/armamentos` | Admin/gestor | Cria armamento. |
| POST | `/armamentos/lote` | Admin/gestor | Cria de 1 a 100 unidades individualizadas, na mesma transação. |
| PUT | `/armamentos/{id}` | Admin/gestor | Atualiza armamento. |
| DELETE | `/armamentos/{id}` | Admin/gestor | Exclui somente sem movimentações. |
| GET | `/coletes` | JWT | Lista coletes. |
| GET | `/coletes/{id}` | JWT | Dados completos e histórico. |
| POST | `/coletes` | Admin/gestor | Cria colete. |
| PUT | `/coletes/{id}` | Admin/gestor | Atualiza dados enviados. |
| DELETE | `/coletes/{id}` | Admin/gestor | Exclui somente sem movimentações. |
| GET | `/municoes` | JWT | Lista por tipo. |
| POST | `/municoes` | Admin/gestor | Cria munição. |
| POST | `/municoes/{id}/entrada` | Admin/gestor | Soma quantidade ao estoque e registra entrada. |
| GET | `/municoes/{id}` | JWT | Detalhes e histórico. |
| PUT | `/municoes/{id}` | Admin/gestor | Atualiza cadastro/quantidade com auditoria. |
| DELETE | `/municoes/{id}` | Admin/gestor | Exclui somente sem movimentações. |
| GET | `/responsaveis` | JWT | Lista por nome. |
| POST | `/responsaveis` | Admin/gestor | Cria responsável. |
| GET | `/responsaveis/{id}` | JWT | Detalhes e histórico. |
| PUT | `/responsaveis/{id}` | Admin/gestor | Atualiza cadastro. |
| DELETE | `/responsaveis/{id}` | Admin/gestor | Exclui somente sem movimentações. |
| GET | `/movimentacoes` | JWT | Lista com armamento, colete ou munição, responsável e autor. |
| POST | `/movimentacoes` | Admin/gestor/operador | Registra movimento; entrada exige admin/gestor. |
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

O sucesso retorna `{ "user": { ... }, "token": "JWT" }`. Use `Authorization: Bearer JWT`. O token expira em um dia; conta, papel e versão da sessão são verificados no banco a cada requisição. Administrador tem acesso completo; gestor altera cadastros e opera; operador registra movimentações, exceto entrada de munição; auditor consulta e exporta relatórios. Criação, alteração e exclusão de cadastros exigem administrador ou gestor. Alterações de senha, papel ou ativação revogam sessões anteriores.

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

### Quantidade de pistolas / armamentos em lote

```http
POST /api/armamentos/lote
Content-Type: application/json
Authorization: Bearer JWT
```

```json
{
  "quantidade":2,
  "dados":{"tipo":"Pistola","marca":"Marca de exemplo","modelo":"Modelo de exemplo","calibre":"9mm","local":"Armaria Central"},
  "unidades":[
    {"numSerie":"DEMO-SERIE-101","numRegistro":"DEMO-REGISTRO-101"},
    {"numSerie":"DEMO-SERIE-102","numRegistro":"DEMO-REGISTRO-102"}
  ]
}
```

`quantidade` deve ser inteira de 1 a 100 e igual ao número de `unidades`. Os dados comuns aceitam aquisição, observações, última manutenção e status inicial `ESTOQUE`, `BLOQUEADA` ou `BAIXADA`. Cada unidade exige série e registro únicos. Resposta: `{ "quantidade": 2, "items": [...] }`. A falha de qualquer unidade desfaz o lote inteiro e sua auditoria. A quantidade de pistolas é a contagem dos cadastros individuais; o lote mantém rastreabilidade de cada arma.

### Colete

```json
{
  "marca":"Marca de exemplo", "modelo":"Operacional", "tamanho":"M", "nivelProtecao":"IIIA",
  "numSerie":"DEMO-COLETE-001", "numPatrimonio":"DEMO-PATRIMONIO-001",
  "dataAquisicao":"2026-10-10", "dataFabricacao":"2026-01-01", "dataValidade":"2031-01-01",
  "local":"Armaria Central", "status":"ESTOQUE", "observacoes":"Capa e painéis conferidos"
}
```

Marca, modelo, tamanho, nível de proteção, série e patrimônio são obrigatórios. Série e patrimônio são únicos. Aquisição e local recebem os padrões da aplicação quando omitidos; fabricação, validade, manutenção e observações são opcionais. Fabricação não pode ser posterior à validade; PUT parcial considera os dados já existentes nessa validação. Um colete com validade anterior ao dia atual no Brasil (UTC−3) não pode ser retirado. O dia de vencimento ainda é válido. Status de uso/manutenção muda por movimentação; DELETE é permitido somente sem histórico.

### Munição

```json
{"tipo":"Treinamento","calibre":"9mm","quantidade":100}
```

Tipo e calibre obrigatórios; quantidade omitida recebe zero. Quantidade deve ser inteira de zero a 2.147.483.647. A API permite ajuste administrativo auditado de quantidade via PUT, definindo um valor absoluto. Na interface, a quantidade fica somente para leitura ao editar; para recebimento, use Adicionar quantidade, que incrementa o estoque e preserva o histórico do lote recebido. DELETE somente sem histórico.

### Entrada de munição

```http
POST /api/municoes/uuid-da-municao/entrada
Content-Type: application/json
Authorization: Bearer JWT

{"quantidade":250,"motivo":"Recebimento de novo lote"}
```

Quantidade inteira positiva e motivo são obrigatórios. A resposta contém o cadastro com estoque atualizado. A entrada soma ao saldo atual, gera movimento `ENTRADA` e auditoria na mesma transação, preservando a soma em entradas simultâneas. Entradas não aumentam o saldo retirado por um responsável. Recebimentos são exclusivos de administrador/gestor; quantidades que ultrapassariam o limite inteiro do banco retornam 409 sem alterar o estoque.

### Responsável

```json
{"nome":"Pessoa de exemplo","identificacaoFuncional":"DEMO-001","setor":"Treinamento"}
```

Todos obrigatórios. PUT altera dados enviados; DELETE somente sem histórico.

### Movimentação

```json
{"tipo":"RETIRADA","motivo":"Exemplo","armamentId":"uuid-do-armamento","responsibleId":"uuid-do-responsavel"}
```

Tipo e motivo obrigatórios; autor vem do JWT. Informe exatamente um entre `armamentId`, `vestId` e `ammunitionId`, com UUID válido. Retirada/devolução exigem `responsibleId`. Armamento ou colete muda para `USO` na retirada e para `ESTOQUE` na devolução; a devolução exige o responsável que fez a retirada. Manutenção/transferência somente partem de estoque. Transferência exige `destino`.

Para munição, informe `quantidade` inteira positiva. São aceitas entrada, retirada e devolução; retirada desconta estoque e devolução é limitada ao saldo daquele responsável. `ENTRADA` também pode ser enviada a `/movimentacoes`, somente para munição e por administrador/gestor, sem exigir responsável. Criação do movimento, atualização do ativo e auditoria ocorrem na mesma transação serializável, com repetição em conflitos de concorrência.

## Respostas

200 para consultas/login/alteração/exclusão; 201 para criação; 400 para validação; 401 para sessão inválida; 403 para papel sem permissão; 404 para registro/rota inexistente; 409 para duplicidade, histórico, estoque ou estado incompatível; 429 para excesso de tentativas de login; 500 para falha interna.

Erros retornam `{ "error": "mensagem" }`. Saúde retorna `{ "status": "OK", "database": "Connected" }`, ou `Error`/`Disconnected` na falha. Cadastros/movimentos são paginados na interface; a API retorna listas. Auditoria é paginada na API, 30 eventos por página.

## Períodos, configurações e arquivos

`inicio` e `fim` usam `YYYY-MM-DD`, com limites de dia no fuso UTC−3; data final é inclusiva. Estão disponíveis em movimentações, auditoria e exportação de histórico. `/audit` também aceita `page` e `acao`. Relatórios aceitam os tipos `armamentos`, `coletes`, `municoes`, `responsaveis`, `movimentacoes` e `auditoria`. PDF usa `application/pdf`; Excel usa `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

`/dashboard` inclui `pistolas` e `pistolasEmEstoque` como contagens de armamentos do tipo pistola, `coletes`, `coletesEmUso` e `coletesEmEstoque` como contagens de coletes. Quantidade de munição é a soma dos estoques cadastrados.

`/settings` recebe `unidade`, `sigla`, `endereco`, `telefone`, `baixoEstoque`, `prazoDevolucao` e `diasManutencao`. `/auth/preferences` recebe os booleanos `manutencao`, `estoque`, `devolucao`. Para leitura de alertas, envie `{ "keys": ["chave-retornada-pela-api"] }` a `/notifications/read`.

Troca de senha recebe `currentPassword` e `newPassword`, mínimo de 12 caracteres, e retorna novo token. Criação de usuário recebe `name`, `email`, `role` e `password`; alteração recebe `name`, `role` e/ou `active`. O administrador não pode desativar ou rebaixar a própria conta.
