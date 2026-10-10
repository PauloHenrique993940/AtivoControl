# API

[README](../README.md) · [Swagger](https://ativocontrol.vercel.app/api/docs) · [OpenAPI](https://ativocontrol.vercel.app/api/openapi.json)

Base: `https://ativocontrol.vercel.app/api`. Docker: `http://localhost:8080/api`. Backend direto: `http://localhost:3333`, sem `/api`.

| Método | Caminho | Autenticação | Resultado |
| --- | --- | --- | --- |
| GET | `/health` | Pública | Conexão com banco. |
| POST | `/auth/login` | Pública | Usuário sem senha e JWT. |
| GET | `/armamentos` | JWT | Lista, mais recentes primeiro. |
| POST | `/armamentos` | JWT | Cria armamento. |
| PUT | `/armamentos/{id}` | JWT | Atualiza armamento. |
| DELETE | `/armamentos/{id}` | JWT | Exclui armamento. |
| GET | `/municoes` | JWT | Lista por tipo. |
| POST | `/municoes` | JWT | Cria munição. |
| GET | `/responsaveis` | JWT | Lista por nome. |
| POST | `/responsaveis` | JWT | Cria responsável. |
| GET | `/movimentacoes` | JWT | Lista com armamento, responsável e nome do usuário. |
| POST | `/movimentacoes` | JWT | Registra movimento. |
| GET | `/docs` | Pública | Swagger. |
| GET | `/openapi.json` | Pública | OpenAPI 3.0.3. |

## Autenticação

```http
POST /api/auth/login
Content-Type: application/json

{"email":"seu-email@example.com","password":"sua-senha"}
```

O sucesso retorna `{ "user": { ... }, "token": "JWT" }`. Use `Authorization: Bearer JWT`. O token expira em um dia; o middleware ainda não distingue permissões por papel.

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

Tipo, marca, modelo, calibre, série e registro são obrigatórios. PUT aceita esses campos e status; não atualiza local ou data de aquisição.

### Munição

```json
{"tipo":"Treinamento","calibre":"9mm","quantidade":100}
```

Tipo e calibre obrigatórios; quantidade omitida recebe zero. Não há atualização ou exclusão de munições nessa versão.

### Responsável

```json
{"nome":"Pessoa de exemplo","identificacaoFuncional":"DEMO-001","setor":"Treinamento"}
```

Todos obrigatórios. Não há atualização ou exclusão de responsáveis nessa versão.

### Movimentação

```json
{"tipo":"RETIRADA","motivo":"Exemplo","armamentId":"uuid-do-armamento","responsibleId":"uuid-do-responsavel"}
```

Tipo obrigatório; autor vem do JWT. `armamentId`, `ammunitionId` e `responsibleId` são opcionais; IDs vazios viram `null`. Retirada muda status para `USO`, devolução para `ESTOQUE`. Não há desconto de munição nem transação única entre movimento e alteração do armamento.

## Respostas

200 para consulta/login/alteração/exclusão; 201 para criação; 400 para campos obrigatórios ausentes ou ID de rota inválido em armamentos; 401 para credenciais/token inválidos; 500 para falhas internas. Conflitos de unicidade e registros inexistentes ainda usam 500.

Controllers retornam `{ "error": "mensagem" }`. Saúde retorna `{ "status": "OK", "database": "Connected" }`, ou `Error`/`Disconnected` na falha. Não há paginação.
