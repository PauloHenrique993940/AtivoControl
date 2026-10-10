const ref=(name:string)=>({$ref:'#/components/schemas/'+name})
const json=(schema:object)=>({'application/json':{schema}})
const s={type:'string'}, number={type:'integer',minimum:0}, uuid={type:'string',format:'uuid'}, datetime={type:'string',format:'date-time'}
const object=(properties:object,required:string[]=[])=>({type:'object',properties,required,additionalProperties:false})
const status={type:'string',enum:['ESTOQUE','USO','MANUTENCAO','BLOQUEADA','BAIXADA']}
const roles={type:'string',enum:['ADMIN','GESTOR_ARMARIA','OPERADOR','AUDITOR']}
const schemas:Record<string,object>={
Error:object({error:s}),
Login:object({email:{type:'string',format:'email'},password:{type:'string',format:'password'}},['email','password']),
Profile:object({name:s,email:{type:'string',format:'email'}},['name','email']),
Password:object({currentPassword:{type:'string',format:'password'},newPassword:{type:'string',format:'password',minLength:12}},['currentPassword','newPassword']),
User:object({id:uuid,name:s,email:s,role:roles,active:{type:'boolean'},preferences:ref('Preferences'),createdAt:datetime,updatedAt:datetime}),
UserInput:object({name:s,email:{type:'string',format:'email'},role:roles,password:{type:'string',format:'password',minLength:12}},['name','email','role','password']),
UserUpdate:object({name:s,role:roles,active:{type:'boolean'}}),
Preferences:object({manutencao:{type:'boolean',default:true},estoque:{type:'boolean',default:true},devolucao:{type:'boolean',default:true}}),
Settings:object({unidade:s,sigla:s,endereco:s,telefone:s,baixoEstoque:number,prazoDevolucao:{type:'integer',minimum:1},diasManutencao:{type:'integer',minimum:1}}),
ArmamentInput:object({tipo:s,marca:s,modelo:s,calibre:s,numSerie:s,numRegistro:s,dataAquisicao:datetime,local:s,status,observacoes:{...s,nullable:true},dataManutencao:{...datetime,nullable:true}},['tipo','marca','modelo','calibre','numSerie','numRegistro']),
ArmamentBatch:object({quantidade:{type:'integer',minimum:1,maximum:100},dados:object({tipo:s,marca:s,modelo:s,calibre:s,dataAquisicao:datetime,local:s,status:{type:'string',enum:['ESTOQUE','BLOQUEADA','BAIXADA'],default:'ESTOQUE'},observacoes:{...s,nullable:true},dataManutencao:{...datetime,nullable:true}},['tipo','marca','modelo','calibre']),unidades:{type:'array',minItems:1,maxItems:100,items:object({numSerie:s,numRegistro:s},['numSerie','numRegistro'])}},['quantidade','dados','unidades']),
AmmunitionInput:object({tipo:s,calibre:s,quantidade:{...number,default:0}},['tipo','calibre']),
AmmunitionEntry:object({quantidade:{type:'integer',minimum:1,maximum:2147483647},motivo:{type:'string',minLength:1,maxLength:2000}},['quantidade','motivo']),
VestInput:object({marca:s,modelo:s,tamanho:s,nivelProtecao:s,numSerie:s,numPatrimonio:s,dataAquisicao:datetime,dataFabricacao:{...datetime,nullable:true},dataValidade:{...datetime,nullable:true},dataManutencao:{...datetime,nullable:true},local:s,status,observacoes:{...s,nullable:true}},['marca','modelo','tamanho','nivelProtecao','numSerie','numPatrimonio']),
ResponsibleInput:object({nome:s,identificacaoFuncional:s,setor:s},['nome','identificacaoFuncional','setor']),
MovementInput:object({tipo:{type:'string',enum:['RETIRADA','DEVOLUCAO','TRANSFERENCIA','MANUTENCAO','ENTRADA']},motivo:s,armamentId:{...uuid,nullable:true},ammunitionId:{...uuid,nullable:true},vestId:{...uuid,nullable:true},responsibleId:{...uuid,nullable:true},quantidade:{type:'integer',minimum:1,maximum:2147483647},destino:{...s,nullable:true}},['tipo','motivo']),
ReadNotifications:object({keys:{type:'array',items:s,maxItems:500}},['keys']),
AuditPage:object({items:{type:'array',items:{type:'object'}},total:number,page:number,pages:number}),
}
for(const name of ['Armament','Ammunition','Vest','Responsible']){const input=schemas[name+'Input'] as {properties:object};schemas[name+'Update']=object(input.properties);schemas[name]=object({...input.properties,id:uuid,createdAt:datetime,updatedAt:datetime})}
const errors=Object.fromEntries([400,401,403,404,409,429,500].map(code=>[code,{description:'Erro de validação, autenticação, permissão, registro, conflito ou servidor',content:json(ref('Error'))}]))
const paths:Record<string,Record<string,object>>={}
function add(path:string,method:string,tag:string,summary:string,options:{body?:string;public?:boolean;schema?:object;code?:number;parameters?:object[];description?:string;binary?:string}={}){
const parameters=[...(path.includes('{id}')?[{name:'id',in:'path',required:true,schema:uuid}]:[]),...(options.parameters||[])];
(paths[path]||={})[method]={tags:[tag],summary,description:options.description,operationId:method+'_'+path.replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,''),...(!options.public?{security:[{bearerAuth:[]}]}:{}),...(parameters.length?{parameters}:{}),...(options.body?{requestBody:{required:true,content:json(ref(options.body))}}:{}),responses:{[options.code||200]:{description:'Operação concluída',content:options.binary?{[options.binary]:{schema:{type:'string',format:'binary'}}}:json(options.schema||{type:'object'})},...errors}}
}
const dates=[{name:'inicio',in:'query',schema:{type:'string',format:'date'}},{name:'fim',in:'query',schema:{type:'string',format:'date'}}]
add('/health','get','Sistema','Verifica a conexão com o banco',{public:true})
add('/auth/login','post','Autenticação','Autentica e retorna JWT',{public:true,body:'Login'})
add('/auth/me','get','Autenticação','Retorna usuário autenticado',{schema:ref('User')})
add('/auth/profile','put','Autenticação','Atualiza nome e email',{body:'Profile',schema:ref('User')})
add('/auth/password','put','Autenticação','Altera senha e revoga tokens anteriores',{body:'Password',description:'Retorna um novo token. Senha atual deve ser válida; nova senha tem mínimo de 12 caracteres.'})
add('/auth/preferences','put','Autenticação','Salva preferências de alertas',{body:'Preferences',schema:ref('User')})
add('/auth/logout','post','Autenticação','Encerra todas as sessões do usuário')
for(const [path,name,tag]of [['armamentos','Armament','Armamentos'],['municoes','Ammunition','Munições'],['coletes','Vest','Coletes'],['responsaveis','Responsible','Responsáveis']]){
add('/'+path,'get',tag,'Lista registros',{schema:{type:'array',items:ref(name)}})
add('/'+path+'/{id}','get',tag,'Exibe detalhes e histórico',{description:'Inclui movements com usuário, ativo e responsável.'})
add('/'+path,'post',tag,'Cria registro',{body:name+'Input',code:201,schema:ref(name),description:'Administrador ou gestor. Armamento ou colete em uso ou manutenção deve ser movimentado após o cadastro. Coletes: fabricação não pode ser posterior à validade; série e patrimônio são únicos.'})
add('/'+path+'/{id}','put',tag,'Atualiza somente os campos enviados',{body:name+'Update',schema:ref(name),description:'Administrador ou gestor. Uso e manutenção são alterados pelas movimentações.'})
add('/'+path+'/{id}','delete',tag,'Exclui registro sem movimentações',{description:'Administrador ou gestor. Registros com histórico retornam 409.'})
}
add('/armamentos/lote','post','Armamentos','Cadastra armamentos por quantidade com identificação individual',{body:'ArmamentBatch',code:201,schema:object({quantidade:number,items:{type:'array',items:ref('Armament')}}),description:'Administrador ou gestor. De 1 a 100 unidades; quantidade deve corresponder ao número de unidades. Cada série e registro é obrigatório e único. Todos os registros e auditoria são salvos na mesma transação; qualquer conflito cancela o lote inteiro.'})
add('/municoes/{id}/entrada','post','Munições','Acrescenta quantidade ao estoque',{body:'AmmunitionEntry',code:201,schema:ref('Ammunition'),description:'Administrador ou gestor. Soma à quantidade disponível e registra movimento ENTRADA e auditoria na mesma transação. Motivo obrigatório. Estoque máximo 2147483647; excesso retorna 409. Entradas não geram saldo retirado pelo responsável.'})
add('/movimentacoes','get','Movimentações','Lista histórico',{parameters:dates,schema:{type:'array',items:{type:'object'}}})
add('/movimentacoes','post','Movimentações','Registra operação, estoque e auditoria na mesma transação',{body:'MovementInput',code:201,description:'Administrador, gestor ou operador. ENTRADA exige administrador ou gestor e admite apenas munição. Exatamente um ativo: armamentId, ammunitionId ou vestId. Retirada/devolução exigem responsável. Munição exige quantidade positiva e permite entrada, retirada ou devolução; devolução limitada ao saldo do responsável. Armamentos e coletes são movimentados individualmente e não aceitam quantidade. Transferência exige destino. Ativo deve estar em estoque para retirada, transferência ou manutenção. Colete com validade vencida não pode ser retirado.'})
add('/settings','get','Configurações','Consulta unidade e parâmetros',{schema:ref('Settings')})
add('/settings','put','Configurações','Salva configurações globais',{body:'Settings',schema:ref('Settings'),description:'Somente administrador.'})
add('/dashboard','get','Painel','Quantidades de armamentos, pistolas, munições e coletes; gráfico calculado do banco')
add('/notifications','get','Alertas','Alertas de estoque, manutenção, validade de coletes e devolução',{schema:{type:'array',items:{type:'object'}}})
add('/notifications/read','post','Alertas','Marca os alertas informados como lidos',{body:'ReadNotifications'})
add('/search','get','Busca','Busca global em cadastros',{parameters:[{name:'term',in:'query',required:true,schema:{type:'string',minLength:2,maxLength:100}}],schema:{type:'array',items:object({id:uuid,label:s,href:s})}})
add('/audit','get','Auditoria','Consulta auditoria paginada',{schema:ref('AuditPage'),parameters:[...dates,{name:'page',in:'query',schema:{type:'integer',minimum:1,default:1}},{name:'acao',in:'query',schema:s}],description:'Administrador, gestor ou auditor. 30 eventos por página.'})
for(const format of ['pdf','xlsx'])add('/reports/{tipo}/'+format,'get','Relatórios','Exporta '+format.toUpperCase(),{parameters:[{name:'tipo',in:'path',required:true,schema:{type:'string',enum:['armamentos','municoes','coletes','responsaveis','movimentacoes','auditoria']}},...dates],binary:format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',description:'Período aplica-se a movimentações e auditoria. Inventários representam o estado atual. Coletes incluem tamanho, proteção, identificação, datas, local e status. Operador não exporta auditoria.'})
add('/users','get','Usuários','Lista usuários',{schema:{type:'array',items:ref('User')},description:'Somente administrador.'})
add('/users','post','Usuários','Cria usuário',{body:'UserInput',code:201,schema:ref('User'),description:'Somente administrador.'})
add('/users/{id}','put','Usuários','Altera papel, nome ou acesso',{body:'UserUpdate',schema:ref('User'),description:'Somente administrador. Revoga sessões anteriores; não permite desativar ou rebaixar a própria conta.'})
export const openapi={openapi:'3.0.3',info:{title:'AtivoControl API',version:'2.1.0',description:'Cadastros, quantidades, coletes, movimentações transacionais, auditoria, configurações e relatórios. Use o token do login em Authorize.'},servers:[{url:'/api',description:'Vercel / Docker / proxy Vite'},{url:'/',description:'Backend direto'}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}},schemas},paths}
