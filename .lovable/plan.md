
Objetivo: corrigir retroativamente o faturamento dos contratos de Boleto Unificado com base na Data de Início da Garantia (guarantee_payment_date), incluindo os 4 contratos da Massaru e todos os casos iguais no sistema.

1) Diagnóstico confirmado (dados atuais)
- Contratos solicitados:
  - #078FBDAD (Gislaine): 1ª parcela está em 04/2026 (deveria estar em 03/2026 pelo guarantee_payment_date=2026-02-28).
  - #A843A9EC (Natan): parcelas 03/2026 e 04/2026 sem vínculo de invoice_item_id; 03/2026 está “paga” sem item/fatura vinculada.
  - #298E7156 (Paulo) e #73D93CA5 (Rayana): parcelas vinculadas, mas calendário ficou deslocado por ajustes/migração anteriores.
- Causa raiz:
  - houve correções manuais/migração que alteraram datas sem reconstruir calendário de parcelas/faturas;
  - contratos migrados ficaram com parcelas órfãs (sem invoice_item_id);
  - a geração histórica não foi consistentemente reconciliada após mudanças de data.
- Escopo retroativo encontrado:
  - 9 contratos com parcelas órfãs em meses que já têm fatura;
  - 84 parcelas órfãs com fatura existente;
  - 12 contratos com divergência na 1ª referência vs regra esperada (guarantee_payment_date + 1 mês).

2) Plano de correção retroativa (dados)
- Executar reconciliação idempotente em lote para todos contratos boleto_imobiliaria ativos:
  1. Calcular referência esperada da 1ª parcela: mês seguinte a guarantee_payment_date.
  2. Detectar dois grupos:
     - (A) calendário deslocado (installment #1 fora da referência esperada);
     - (B) parcelas órfãs (invoice_item_id nulo com fatura existente no mesmo mês/ano).
  3. Corrigir grupo B:
     - criar invoice_items faltantes;
     - sincronizar status da parcela com status da fatura (paga/faturada) e paid_at quando aplicável.
  4. Corrigir grupo A:
     - reindexar referências das 12 parcelas para o calendário correto;
     - remover vínculos antigos inconsistentes e recriar vínculos corretos por mês/ano;
     - atualizar totais das faturas abertas impactadas (rascunho/gerada/enviada/vencida) via soma real dos itens.
  5. Registrar trilha de auditoria (analysis_timeline + invoice_timeline) para cada contrato/fatura ajustados.

3) Blindagem para não acontecer novamente
- Atualizar lógica de geração para priorizar guarantee_payment_date como base do ciclo.
- Evoluir a reconciliação automática para cobrir:
  - contrato sem parcelas,
  - parcela órfã,
  - calendário deslocado após mudança de data.
- Quando guarantee_payment_date for alterada em contrato boleto com parcelas existentes, disparar reconciliação automática do contrato (sem depender de ação manual).

4) Verificação final (obrigatória)
- Validar especificamente Massaru:
  - #078FBDAD e #A843A9EC com 1ª parcela em 03/2026 e 2ª em 04/2026, ambas vinculadas à fatura correta;
  - #298E7156 e #73D93CA5 alinhados ao calendário correto pela regra da data-base.
- Validar global:
  - zero parcelas órfãs em meses com fatura existente;
  - zero contratos ativos com 1ª referência divergente da regra;
  - totais das faturas abertas batendo com soma de invoice_items.
- Entregar relatório final com contratos corrigidos, antes/depois e impactos por imobiliária.

5) Detalhes técnicos
- Mudança de schema (gatilhos/funções): via migração.
- Mudança de dados (UPDATE/INSERT/DELETE): via operação de dados dedicada.
- Reconciliação implementada para ser reexecutável (idempotente), evitando duplicação de invoice_items e retrabalho.
