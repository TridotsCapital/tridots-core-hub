
Objetivo: corrigir de forma definitiva para que a imobiliária veja boleto/código/observações no portal e receba notificação por e-mail + in-app, tanto para novos uploads quanto para boletos já existentes.

Diagnóstico confirmado no projeto (causas reais)
1) A tela que a imobiliária usa hoje (/agency/invoices) não leva para o detalhe da fatura
- O boleto/código/observações foram implementados em /agency/invoices/:invoiceId (AgencyInvoiceDetail), mas na listagem atual só existe “Ver Contrato”.
- Resultado: a imobiliária não chega na tela onde os dados aparecem, então parece que “não existe boleto”.

2) E-mail de boleto está sendo disparado com assinatura de função errada
- Em send-invoice-notification, a chamada de sendEmail está com os parâmetros na posição errada (o array de anexo entra no lugar do testMode).
- Isso pode desviar envio para e-mail de teste e mascarar sucesso no log.

3) Notificação in-app está sendo gravada na tabela errada e com tipo incompatível
- O código grava em ticket_notifications, mas o sino do portal lê a tabela notifications.
- Além disso, o type usado (“boleto_available”) não bate com o modelo da UI (“invoice_boleto_available”).
- E o insert não checa erro (falha silenciosa).

4) Há erros intermitentes de agencyId undefined na função
- Logs mostram tentativas com agencyId inválido.
- Isso bloqueia parte das tentativas de envio.

5) Os dados do boleto já estão no banco
- boleto_url, boleto_barcode e boleto_observations existem em faturas antigas e novas.
- O problema principal não é ausência de dados; é fluxo/UI + notificação.

Plano de correção (implementação)
Fase 1 — Corrigir acesso visual no portal da imobiliária
- Arquivos: src/pages/agency/AgencyInvoices.tsx e src/hooks/useMonthlyInvoiceSummary.ts
- Ações:
  - Expor o invoiceId da fatura do mês selecionado no hook de parcelas/mês.
  - Incluir botão “Ver detalhes da fatura” na tela /agency/invoices quando houver fatura no mês.
  - Opcional visual imediato: badge “Boleto disponível” na listagem quando houver boleto_url, para reduzir dúvida operacional.
- Resultado esperado:
  - A imobiliária sempre consegue chegar ao detalhe da fatura onde boleto/código/observações são exibidos.

Fase 2 — Tornar o detalhe de fatura robusto para baixar/visualizar boleto
- Arquivo: src/pages/agency/AgencyInvoiceDetail.tsx
- Ações:
  - Manter exibição de código de barras e observações (já existe).
  - Fortalecer resolução de caminho do arquivo para bucket privado:
    - suportar URL antiga (/object/public/invoices/...) e variações futuras;
    - fallback seguro quando não conseguir extrair caminho.
  - Oferecer “Visualizar” e “Baixar” com fluxo autenticado (sem depender de URL pública).
- Resultado esperado:
  - Boletos antigos e novos ficam acessíveis para visualização/download.

Fase 3 — Corrigir disparo de e-mail de boleto (novo upload e reenvio)
- Arquivo: supabase/functions/send-invoice-notification/index.ts
- Ações:
  - Ajustar chamada de sendEmail com assinatura correta (sem deslocar argumentos).
  - Tornar agencyId opcional no payload e buscar da própria fatura quando ausente.
  - Garantir geração de link temporário de download válida para e-mail.
  - Validar e tratar erro em todas as operações críticas (envio, logs, inserts).
- Resultado esperado:
  - E-mail real chega para a imobiliária (não para endereço de teste), de forma consistente.

Fase 4 — Corrigir notificação in-app do sino da imobiliária
- Arquivos: supabase/functions/send-invoice-notification/index.ts, src/types/notifications.ts (alinhamento final)
- Ações:
  - Inserir notificações na tabela notifications (não ticket_notifications).
  - Usar type compatível com a UI: invoice_boleto_available.
  - source = sistema, reference_id = invoiceId, título/mensagem claros.
  - Inserir para todos os agency_users da agência.
- Resultado esperado:
  - Notificação aparece no sino do portal da imobiliária.

Fase 5 — Retroativo para boletos já existentes
- Estratégia idempotente (sem duplicar envios):
  - Varrer faturas com boleto_url preenchido.
  - Reenviar notificação apenas se faltar evidência prévia (email_logs/template e/ou notification in-app).
- Implementação:
  - Criar rotina de backfill controlada (função administrativa) com relatório final:
    - processadas, enviadas, ignoradas (já notificadas), falhas.
- Resultado esperado:
  - Corrige histórico já subido na plataforma, não só os próximos uploads.

Fase 6 — Ajustes no upload para confiabilidade futura
- Arquivo: src/components/invoices/BoletoUploadDialog.tsx
- Ações:
  - Manter gravação de barcode e observações.
  - Garantir que invoke de notificação sempre envie invoiceId e que agencyId possa ser dispensável (função resolve internamente).
  - Melhorar feedback quando envio de notificação falhar (sem perder upload).
- Resultado esperado:
  - Novos boletos entram com dados completos e notificação confiável.

Validação final (checklist de aceite)
1) Novo upload de boleto
- Tridots sobe PDF + código + observações.
- Imobiliária abre /agency/invoices → “Ver detalhes da fatura”.
- Vê botão de boleto, código copiável e observações.
- Recebe e-mail de boleto.
- Recebe notificação no sino.

2) Boleto antigo já existente
- Acessa detalhe da fatura antiga e visualiza/baixa boleto.
- Backfill dispara e-mail/in-app quando faltante.
- Sem duplicidade excessiva para registros já notificados.

3) Reenvio manual
- Botão “Reenviar notificação” continua funcional após correções.

Sequenciamento (ordem de execução)
1. Corrigir função de notificação (e-mail + in-app + agencyId fallback)
2. Corrigir navegação do portal da imobiliária para detalhe da fatura
3. Fortalecer download/visualização no detalhe da fatura
4. Rodar backfill retroativo com relatório
5. Validar ponta a ponta com casos novo + histórico

Risco e mitigação
- Risco: duplicar notificações no retroativo.
- Mitigação: backfill idempotente com critérios de “já notificado” antes de enviar.
- Risco: falhas silenciosas.
- Mitigação: checagem explícita de error em todos os inserts/invokes e logs estruturados por invoiceId.
