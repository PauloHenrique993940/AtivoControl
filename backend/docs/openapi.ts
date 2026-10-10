const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema: object) => ({ 'application/json': { schema } })
const error = { description: 'Erro', content: json(ref('Error')) }
const properties = (fields: Record<string, string>) => Object.fromEntries(Object.entries(fields).map(([name, type]) => [name, type === 'date-time' ? { type: 'string', format: type } : { type }]))
const schemas = {
  Error: { type: 'object', properties: { error: { type: 'string' } } },
  User: { type: 'object', properties: properties({ id: 'string', name: 'string', email: 'string', role: 'string', createdAt: 'date-time', updatedAt: 'date-time' }) },
  ArmamentInput: { type: 'object', required: ['tipo', 'marca', 'modelo', 'calibre', 'numSerie', 'numRegistro'], properties: properties({ tipo: 'string', marca: 'string', modelo: 'string', calibre: 'string', numSerie: 'string', numRegistro: 'string', dataAquisicao: 'date-time', local: 'string', status: 'string' }) },
  ArmamentUpdate: { type: 'object', properties: properties({ tipo: 'string', marca: 'string', modelo: 'string', calibre: 'string', numSerie: 'string', numRegistro: 'string', status: 'string' }) },
  AmmunitionInput: { type: 'object', required: ['tipo', 'calibre'], properties: properties({ tipo: 'string', calibre: 'string', quantidade: 'integer' }) },
  ResponsibleInput: { type: 'object', required: ['nome', 'identificacaoFuncional', 'setor'], properties: properties({ nome: 'string', identificacaoFuncional: 'string', setor: 'string' }) },
  MovementInput: { type: 'object', required: ['tipo'], properties: properties({ tipo: 'string', motivo: 'string', armamentId: 'string', ammunitionId: 'string', responsibleId: 'string' }) },
}
const paths: Record<string, object> = {
  '/health': { get: { tags: ['Sistema'], summary: 'Verifica a conexão com o banco', responses: { 200: { description: 'Banco conectado' }, 500: { description: 'Banco indisponível' } } } },
  '/auth/login': { post: { tags: ['Autenticação'], summary: 'Autentica e retorna JWT', requestBody: { required: true, content: json({ type: 'object', required: ['email', 'password'], properties: properties({ email: 'string', password: 'string' }) }) }, responses: { 200: { description: 'Autenticado', content: json({ type: 'object', properties: { token: { type: 'string' }, user: ref('User') } }) }, 401: error, 500: error } } },
}
for (const [route, schema, tag] of [['armamentos', 'ArmamentInput', 'Armamentos'], ['municoes', 'AmmunitionInput', 'Munições'], ['responsaveis', 'ResponsibleInput', 'Responsáveis'], ['movimentacoes', 'MovementInput', 'Movimentações']]) {
  const responseSchema = { allOf: [ref(schema), { type: 'object', properties: properties({ id: 'string', createdAt: 'date-time' }) }] }
  paths[`/${route}`] = {
    get: { tags: [tag], summary: `Lista ${tag.toLowerCase()}`, security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de registros', content: json({ type: 'array', items: responseSchema }) }, 401: error, 500: error } },
    post: { tags: [tag], summary: 'Cria um registro', security: [{ bearerAuth: [] }], requestBody: { required: true, content: json(ref(schema)) }, responses: { 201: { description: 'Criado', content: json(responseSchema) }, 400: error, 401: error, 500: error } },
  }
}
const secured = { tags: ['Armamentos'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }] }
paths['/armamentos/{id}'] = {
  put: { ...secured, summary: 'Atualiza armamento', requestBody: { required: true, content: json(ref('ArmamentUpdate')) }, responses: { 200: { description: 'Atualizado' }, 401: error, 500: error } },
  delete: { ...secured, summary: 'Remove armamento', responses: { 200: { description: 'Removido', content: json({ type: 'object', properties: { message: { type: 'string' } } }) }, 401: error, 500: error } },
}
export const openapi = {
  openapi: '3.0.3',
  info: { title: 'AtivoControl API', version: '1.0.0', description: 'Gestão de armamentos, munições, responsáveis e movimentações. Use o token do login em Authorize.' },
  servers: [{ url: '/api', description: 'Vercel / Docker / proxy Vite' }, { url: '/', description: 'Backend direto' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas },
  paths,
}
