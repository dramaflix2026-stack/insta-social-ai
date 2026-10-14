# Insta Social AI — operação do piloto automático

## Estado do agendador
- A rota autenticada `GET /api/cron/instagram-autopilot` executa no máximo **um** item vencido por chamada. Ela exige `Authorization: Bearer <CRON_SECRET>`.
- Publicação real só ocorre quando `AUTOPILOT_PUBLISH_ENABLED=true` no ambiente de produção; caso contrário a resposta é `dry_run`.
- O `vercel.json` atual usa `0 12 * * *` (uma vez por dia, 12:00 UTC). Isso **não atende** a frequências de 2 a 8 posts por dia e não garante horário exato. Não anunciar a automação de alta frequência como pronta até configurar agendador externo confiável e homologar.
- Para frequência subdiária, configure um serviço de cron externo para chamar o endpoint com HTTPS e cabeçalho de autorização, com periodicidade apropriada (ex.: 5 minutos), considerando custos e limites da hospedagem. Evite ativar cron externo e cron interno em paralelo sem avaliar concorrência.
- Cada chamada pode fazer geração paga de imagem e publicação real. Nunca use esta rota como teste com a publicação habilitada sem consentimento.

## Critérios de homologação
1. Confirmar no Vercel o build em Ready e variáveis de ambiente configuradas.
2. Fazer teste dry_run com plano ativo e um item vencido; validar que não publicou nem gastou crédito.
3. Ativar publicação real somente em conta autorizada e verificar o post no Instagram e no banco.
4. Validar pausas, limite mensal de créditos, vencimento de token e item sem imagem.
5. Confirmar que publicação incerta não é reenviada automaticamente; reconciliar o media ID no Instagram antes de tentar de novo.
6. Validar isolamento de duas contas e 48 horas de operação, inclusive mais de uma postagem diária.

## Riscos conhecidos
- Falhas após publicar no Instagram podem exigir reconciliação manual do registro local.
- O worker atualmente trata um item por execução, sem fila com retentativas automáticas completas.
- O horário do calendário é gerado em UTC; falta seleção explícita de fuso horário do cliente.
- O modelo de créditos deve ser conciliado se a imagem for gerada, mas falhar o registro de uso.
