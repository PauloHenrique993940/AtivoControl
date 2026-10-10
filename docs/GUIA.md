# Guia de uso, prints e vídeos

[README](../README.md) · [API](API.md) · [Aplicação](https://ativocontrol.vercel.app)

Capturas reais da aplicação publicada em 10/10/2026. Listas, indicadores e alertas representam o banco conectado no momento da captura. As gravações não inserem dados demonstrativos.

## Vídeos

| Gravação | Conteúdo |
| --- | --- |
| [Tour da aplicação](media/tour-aplicacao.webm) | Login sem credenciais visíveis e navegação pelos módulos. |
| [Tour do Swagger](media/tour-swagger.webm) | Documentação e execução de `GET /health` contra o Neon. |

WebM sem narração. Use **View raw/Download** no GitHub. Links diretos: [aplicação](https://raw.githubusercontent.com/PauloHenrique993940/AtivoControl/main/docs/media/tour-aplicacao.webm) e [Swagger](https://raw.githubusercontent.com/PauloHenrique993940/AtivoControl/main/docs/media/tour-swagger.webm). Senhas e tokens não foram gravados.

## Login

Entre com um usuário cadastrado. O seed cria o administrador com as variáveis locais. JWT expira em um dia; sair encerra suas sessões. A página pode ser recarregada sem perder uma sessão válida.

![Login](media/01-login.png)

## Painel central

Cartões mostram armamentos, pistolas, coletes e quantidade de munições, com indicadores de estoque e uso. O gráfico usa as movimentações dos últimos seis meses; alertas dependem dos parâmetros e preferências salvos.

![Painel](media/02-dashboard.png)

## Armamentos

Cadastre tipo, marca, modelo, calibre, série, registro, aquisição, local e observações. Série e registro são únicos. Edite os dados ou abra Detalhes para consultar o histórico. Uso/manutenção são alterados pelas movimentações. Exclusão é permitida somente sem histórico; use bloqueio ou baixa para preservar registros vinculados.

Para adicionar várias pistolas, use o cadastro em lote. Informe a quantidade (até 100), preencha os dados comuns e a série/registro de cada unidade. Cada pistola permanece identificada individualmente. Se houver uma identificação repetida ou inválida, nenhuma unidade daquele lote é salva. As quantidades exibidas são calculadas pela contagem dos registros, incluindo as unidades cadastradas em lote.

![Armamentos](media/03-armamentos.png)

## Munições

Cadastre tipo, calibre e quantidade inicial. Para acrescentar munição a um cadastro existente, abra a opção de entrada e informe a quantidade recebida e o motivo. A quantidade é somada ao estoque e a entrada fica no histórico com seu autor; administrador e gestor podem registrar recebimentos.

Edite, pesquise, abra detalhes ou exclua lotes sem histórico. Retirada reduz o estoque; devolução repõe a quantidade e é limitada ao saldo retirado pelo responsável. Entradas não contam como retirada de um responsável. Ajustes manuais do cadastro são auditados.

![Munições](media/04-municoes.png)

## Coletes

Cadastre marca, modelo, tamanho (por exemplo, P, M, G ou GG), nível de proteção, número de série e patrimônio. Registre aquisição, local, observações e, quando disponíveis, fabricação, validade e última manutenção. Série e patrimônio são únicos; fabricação deve ser anterior ou igual à validade.

Use Detalhes para consultar os dados e o histórico, ou Editar para corrigir tamanho e demais informações. Um colete vencido não pode ser retirado; a data de validade é comparada ao dia atual no fuso do Brasil. Retirada, devolução, transferência e manutenção usam o mesmo fluxo dos armamentos, escolhendo a categoria colete. Exclusão é permitida somente sem movimentações.

![Coletes](media/11-coletes.png)

## Responsáveis

Cadastre nome, identificação funcional única e setor. Edite ou consulte os detalhes e vínculos. Responsáveis com histórico não podem ser excluídos.

![Responsáveis](media/05-responsaveis.png)

## Movimentações

Escolha armamento, colete ou munição, operação e motivo. Retirada/devolução exigem responsável; munição exige quantidade. Entrada é exclusiva de munição e de administrador/gestor. Transferência de armamento ou colete exige destino. Retirada altera status para `USO`, devolução para `ESTOQUE`, manutenção para `MANUTENCAO`; devolução da manutenção registra a data da revisão. O usuário autor vem da sessão. Estoque, registro e auditoria são salvos juntos.

![Movimentações](media/06-movimentacoes.png)

## Relatórios

Selecione o período e baixe PDF ou Excel de armamentos, coletes, munições, responsáveis, movimentações e auditoria. Inventários mostram a posição atual; o período filtra histórico e auditoria. O operador não acessa auditoria. A tabela de eventos tem paginação; a impressão da página também está disponível.

![Relatórios](media/07-relatorios.png)

## Configurações

Salve dados da unidade e parâmetros de alertas como administrador. Edite nome/email no perfil, altere sua senha informando a atual e confirme a nova senha. Preferências pessoais controlam os três tipos de alerta. A aba Usuários permite ao administrador cadastrar contas, alterar papéis e ativar/desativar acesso. Busca global encontra cadastros; notificações podem ser marcadas como lidas.

![Configurações](media/08-configuracoes.png)

## Swagger

Abra [Swagger](https://ativocontrol.vercel.app/api/docs). Use **Authorize** com token do login nas rotas protegidas. Para saúde do banco, expanda `GET /health`, clique em **Try it out** e **Execute**.

![Swagger](media/09-swagger.png)

![Swagger verificando o banco](media/10-swagger-health.png)

## Atualizar a mídia

Configure `ADMIN_EMAIL` e `ADMIN_PASSWORD` em `backend/.env`:

```sh
npm ci
npx playwright install chromium ffmpeg
npm run docs:capture
```

`DOCS_BASE_URL` permite capturar outra instalação. O script autentica, navega e consulta saúde; não modifica cadastros nem salva tokens em artefatos.
