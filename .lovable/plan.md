
## Diagnóstico confirmado (já validado no banco)

Encontrei a causa raiz do erro crítico e os contratos afetados:

1. **Contrato `948535e3-8195-4799-9fec-fd05b814c4d0` (#948535E3)**  
   - `analyses.forma_pagamento_preferida = 'boleto_imobiliaria'`  
   - `contracts.payment_method = NULL`  
   - `guarantee_installments = 0`  
   - `invoice_items = 0`

2. **Contrato `60d06af6-ed51-4df9-873a-d24962c02c15`**  
   - Mesmo padrão acima (forma na análise em boleto, contrato sem payment_method e sem parcelas/faturas)

### Por que acontece
- A geração de parcelas/faturas depende do contrato estar com `payment_method = 'boleto_imobiliaria'`.
- No histórico, alguns contratos ficaram com **inconsistência entre análise e contrato** (forma em boleto na análise, mas contrato sem `payment_method` em boleto).
- Quando isso ocorre, a função de geração não processa esses contratos (ou não é disparada), e nada aparece em ambos os portais.

## Impedimentos de regra de negócio

**Não há impedimento para correção** nesses casos:
- Contratos estão em `documentacao_pendente`
- Sem assinatura/cartão Stripe vinculada
- Sem parcelas/faturas já geradas para esses contratos inconsistentes

## Plano de correção (implementação)

### 1) Blindar a função de geração para aceitar inconsistência histórica
**Arquivo:** `supabase/functions/generate-installments/index.ts`

Ajustes:
- Incluir no `select` do contrato:
  - `contracts.created_at`
  - `analysis.forma_pagamento_preferida`
- Trocar a validação rígida de `contract.payment_method` por lógica resiliente:
  - Se `contract.payment_method === boleto_imobiliaria`: processa normal
  - Se `contract.payment_method` não é boleto **mas** `analysis.forma_pagamento_preferida === boleto_imobiliaria`:  
    - sincroniza `contracts.payment_method = 'boleto_imobiliaria'`
    - segue geração normalmente
- Manter idempotência atual (se já houver parcelas, retorna `skipped`).
- Ajustar data base para cálculo da 1ª parcela:
  - usar `activated_at || created_at` (evita distorção em backfill tardio).

### 2) Criar rotina de reparo em massa (para garantir “todos os outros contratos”)
**Novo arquivo:** `supabase/functions/reconcile-boleto-contracts/index.ts`

Função administrativa que:
- Busca todos os contratos com:
  - `analyses.forma_pagamento_preferida = 'boleto_imobiliaria'`
  - e (`contracts.payment_method IS DISTINCT FROM 'boleto_imobiliaria'` **ou** sem parcelas)
- Para cada contrato encontrado:
  1. sincroniza `contracts.payment_method` para boleto
  2. invoca `generate-installments` com `contract_id`
  3. registra evento em timeline (reparo automático)
- Retorna relatório final (`total_encontrados`, `corrigidos`, `falhas`, lista de contratos).

### 3) Prevenção permanente para futuras mudanças manuais de forma de pagamento
**Migração SQL nova (em `supabase/migrations/...sql`)**

Adicionar trigger em `analyses`:
- Quando `forma_pagamento_preferida` mudar para `boleto_imobiliaria` e já existir contrato vinculado:
  - sincroniza `contracts.payment_method`
  - dispara processamento automático de parcelas/faturas via backend function
Assim, futuras alterações manuais não voltam a quebrar.

### 4) Executar reparo imediato dos casos atuais
Após deploy:
- Rodar `reconcile-boleto-contracts`.
- Esperado hoje: corrigir **2 contratos** (`948...` e `60d...`).

## Validação obrigatória pós-correção

1. Contratos afetados:
- `contracts.payment_method = 'boleto_imobiliaria'`

2. Financeiro:
- `guarantee_installments = 12` por contrato
- `invoice_items = 12` por contrato
- `agency_invoices` criadas/atualizadas nos meses de referência corretos

3. Portais (ambos):
- Aba/visão de parcelas aparece
- Parcelas listadas no detalhe do contrato
- Faturas mensais aparecem na relação financeira da imobiliária e do time interno

## Arquivos previstos no escopo

- `supabase/functions/generate-installments/index.ts` (edição)
- `supabase/functions/reconcile-boleto-contracts/index.ts` (novo)
- `supabase/migrations/<timestamp>_auto_sync_boleto_contracts.sql` (novo trigger/prevenção)

## Resultado esperado

- O contrato #948535E3 passa a ter parcelas e vínculo em faturas corretamente.
- Todos os contratos já existentes nessa mesma situação serão reparados em lote.
- O problema não se repete quando a forma de pagamento for alterada para boleto unificado no futuro.
