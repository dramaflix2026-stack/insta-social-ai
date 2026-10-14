# Insta Social AI — Política comercial (14/10/2026)

## Oferta definida
- Plano: **Básico**
- Preço de tabela: **R$ 97/mês**
- Franquia: **100 gerações de imagem bem-sucedidas por ciclo mensal**
- Conta: **1 Instagram**
- Inclui: identidade visual com IA, calendário editorial, legendas, edição, agendamento e publicação automática após autorização.
- Uma geração de imagem e uma publicação são operações distintas. Não prometer 100 publicações.
- A assinatura, cobrança recorrente, período de renovação, cancelamento e meios de pagamento ainda dependem de implementação e testes. A LP não deve representar checkout como ativo.

## Unit economics (hipótese, não custo auditado)
- Premissa: US$ 10 / 600 imagens = US$ 0,016667 por imagem.
- Uso integral do Básico: 100 imagens = US$ 1,67 por assinante/mês.
- Orçamento de US$ 2,50 equivale a 150 imagens ao custo hipotético.
- Confirmar preço efetivo da API, qualidade, referências/edições, retries, câmbio, taxas, infraestrutura e suporte.

## Bloqueios antes da cobrança
1. Criar fonte de verdade de assinaturas/entitlements por usuário, com status, plano, período de cobrança e limite de 100 imagens.
2. Aplicar o mesmo limite na geração manual e no cron automático (atualmente ambos usam 150 fixo). Usar operações atômicas para evitar ultrapassar o limite em chamadas simultâneas.
3. Definir comportamento para contas de teste/administrador e clientes legados, sem reduzir limites silenciosamente.
4. Integrar gateway com webhooks assinados e processamento idempotente; só liberar acesso pago após confirmação válida.
5. Implementar upgrade/downgrade, inadimplência, cancelamento e renovação dos créditos por ciclo de cobrança.
6. Verificar custo real, testes de publicação e clareza do consentimento individual.
7. Revisar termos, privacidade/LGPD, política de reembolso e canais de suporte.

## LP
- Rota: /instagram-ai
- CTA temporário: Conhecer a plataforma -> /login. Não chamar de 'Assinar'.
- Oferta visível: somente Básico R$ 97/mês, 100 imagens.
- Não anunciar planos Pro/Agency até precificação, cotas e entitlement serem aprovados.
