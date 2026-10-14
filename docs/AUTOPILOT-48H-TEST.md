# Homologação do Insta Social AI

## Configuração necessária
1. No Vercel, configure `CRON_SECRET` (valor longo e aleatório) e `AUTOPILOT_PUBLISH_ENABLED`. Mantenha a última variável diferente de `true` durante os testes sem publicação.
2. Em GitHub > Settings > Secrets and variables > Actions, crie `INSTA_AUTOPILOT_CRON_SECRET` com **exatamente o mesmo valor** de `CRON_SECRET` no Vercel.
3. Verifique GitHub Actions > Instagram Autopilot Scheduler. A agenda solicita execução a cada cinco minutos, mas o GitHub pode atrasar execuções; não há SLA de minuto exato.
4. A Vercel Hobby mantém apenas um cron diário como fallback. O executor processa **um item vencido por chamada**, portanto atrasos ou filas podem acumular.
5. Para testar manualmente, use **Run workflow** em GitHub Actions. No modo dry_run, a resposta deve incluir `mode:dry_run` e nenhum post deve ser publicado.
6. Ative `AUTOPILOT_PUBLISH_ENABLED=true` somente com autorização explícita e depois de conferir o plano e os itens ativos.

## Plano de teste de 48 horas
- Hora 0: confira build Ready, credenciais, modo dry_run e ausência de publicações indevidas.
- Hora 1: habilite um plano de teste com consentimento explícito e um item agendado. Confirme no perfil Instagram e na tabela de posts.
- Hora 2: pause o plano e confirme que nenhum item adicional é publicado.
- Hora 4: reative o plano; confirme que não ocorre duplicação de itens já publicados.
- Hora 24: confira execuções agendadas, créditos debitados, logs e erros de mídia.
- Hora 48: confira todas as publicações previstas, falhas, créditos e reconciliação de registros.

## Limitações e segurança
- A geração de imagens e publicação real exigem autorização e podem consumir créditos.
- Se o worker registrar falha em `publish_uncertain` ou `record`, **não reenvie automaticamente**: pode já ter sido publicado no Instagram.
- Se a imagem foi criada mas o banco falhou, reconcilie o arquivo antes de cobrar/gerar outra vez.
- A recuperação automática completa, fuso horário por cliente e garantia de entrega em horário exato ainda requerem trabalho adicional.
- Nunca registre ou compartilhe `CRON_SECRET` ou tokens do Instagram em logs.
