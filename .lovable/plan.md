

# Plano Detalhado: 4 Correcoes Criticas

## ITEM 1: Correcao Global de Datas (Timezone)

### Problema
O JavaScript interpreta datas no formato "YYYY-MM-DD" como UTC meia-noite. No fuso UTC-3 (Brasil), isso exibe dia anterior (ex: dia 10 vira dia 09).

### Estrategia: Funcao Global + Auditoria Completa
Criar uma funcao utilitaria `formatDateBR` em `src/lib/utils.ts` que use `parseISO` do date-fns para tratar datas corretamente.

### Arquivos Afetados (auditoria identificou 61 arquivos com `format(new Date(`)
Substituicao em massa dos padroes:
- `format(new Date(algumaCampoDeData), "dd/MM/yyyy", ...)` -> `formatDateBR(algumaCampoDeData, "dd/MM/yyyy")`
- Ou substituir `new Date(campo)` por `parseISO(campo)` diretamente

Principais componentes a corrigir:
- `ContractInstallmentsTab.tsx` (parcelas de contrato)
- `ContractCommissionsTab.tsx` (comissoes)
- `AgencyContractList.tsx` (lista de contratos agencia)
- `AgencyInvoiceDetail` / `FinancialDashboard` / `FinancialInvoices.tsx`
- `InvoiceTimelineView.tsx` / `ClaimDebtTable.tsx`
- `ContractRenewalTab.tsx` / `ClaimContractTab.tsx`
- Email templates em `_shared/email-templates.ts`
- Demais componentes identificados na auditoria

### Implementacao
```text
// Em src/lib/utils.ts
export function formatDateBR(dateStr: string, pattern: string): string {
  return format(parseISO(dateStr), pattern, { locale: ptBR });
}
```

---

## ITEM 2: Recalculo em Cascata ao Reajustar Taxa na Aprovacao

### Problema
Quando a Tridots ajusta `taxa_garantia_percentual` no `ApprovalModal`, o `garantia_anual` NAO e recalculado. Isso causa parcelas, faturas e comissoes com valores desatualizados.

### Correcao em 3 camadas

**Camada 1: ApprovalModal.tsx (frontend)**
- Quando `isRateAdjusted = true`, incluir no `updateData`:
  - `garantia_anual` recalculado: `valorTotal * taxaGarantia / 100 * 12` (com desconto PIX se aplicavel)
- Isso garante que o valor gravado na analise esteja correto ANTES da validacao de pagamento.

**Camada 2: validate-payments (Edge Function)**
- Adicionar validacao de seguranca: se `rate_adjusted_by_tridots === true`, recalcular `garantiaAnual` a partir de `taxa_garantia_percentual * valor_total * 12` ao inves de confiar no campo `garantia_anual`.
- Apos criar contrato e parcelas, se houve reajuste, atualizar em cascata:
  1. `guarantee_installments`: UPDATE valor de cada parcela = novo `garantiaAnual / 12`
  2. `commissions` (recorrentes): UPDATE `base_calculo` e `valor` baseado no novo garantiaAnual
  3. `invoice_items` (se ja existirem): UPDATE valor baseado na nova parcela

**Camada 3: generate-installments (Edge Function)**
- Garantir que ao ler `garantia_anual` da analise, o valor ja esteja atualizado (garantido pela Camada 1).
- Nenhuma mudanca necessaria se a Camada 1 funcionar corretamente, mas adicionar log de validacao.

### Fluxo do Reajuste em Cascata

```text
ApprovalModal (taxa ajustada)
  |
  v
analyses.garantia_anual = recalculado
  |
  v
validate-payments
  |-- cria contrato
  |-- gera parcelas (generate-installments usa garantia_anual correto)
  |-- gera comissoes (usa garantia_anual correto)
  |-- UPDATE em cascata se parcelas/faturas ja existem
```

---

## ITEM 3: Comissoes Ausentes + Retroativas

### Problema
Analise #2F62E17E (taxa 14%, boleto unificado, setup free) nao gerou comissoes porque `plano_garantia = NULL` e a funcao falhou silenciosamente.

### Correcao em 2 partes

**Parte 1: Inferencia robusta de plano no validate-payments**
No inicio de `generateCommissions()`, ANTES do fallback para 'start':

```text
Se plano_garantia == NULL:
  Se taxa_garantia_percentual >= 10 e <= 12.5 -> plano = 'start' (5% comissao)
  Se taxa_garantia_percentual >= 13 e <= 14.5 -> plano = 'prime' (10% comissao)
  Se taxa_garantia_percentual == 15 -> plano = 'exclusive' (15% comissao)
```

Regra: O plano depende SOMENTE da taxa_garantia_percentual. Descontos (PIX, setup free) NAO afetam a inferencia do plano nem o percentual de comissao.

Adicionar tambem: atualizacao do campo `plano_garantia` na analise para evitar reprocessamento.

**Parte 2: Gerar comissoes retroativas para #2F62E17E**
- 12 comissoes recorrentes completas (mes 1-12 a partir da data de ativacao)
- Taxa 14% = PRIME = 10% comissao sobre garantia_anual
- Setup fee = 0 (isentas), entao sem comissao de setup
- Sera executado chamando a funcao validate-payments com logica de reprocessamento, ou via SQL direto

**Parte 3: Melhorar tratamento de erro**
- Atualmente o catch em `generateCommissions` apenas loga o erro. Adicionar notificacao in-app para equipe Tridots quando comissoes falham, para nao passar despercebido.

---

## ITEM 4: Notificacoes Bidirecionais de Chamados

### Problema Atual
Os triggers SQL so disparam quando o remetente e Tridots (master/analyst). Quando a agencia cria/responde, ninguem e notificado.

### Regras Definidas

| Remetente | Destinatario E-mail | Destinatario In-App |
|---|---|---|
| Agencia cria/responde | Todos users master/analyst ativos | notifications para masters/analysts |
| Tridots cria/responde | responsavel_email + colaborador designado (assigned_to) | notifications para agency_users |
| Remetente | NAO recebe e-mail/notificacao da propria acao | Toast visual "Mensagem enviada" |

### Correcao em 4 camadas

**Camada 1: Trigger SQL `notify_agency_new_ticket`**
Remover restricao de role. Nova logica:
- Buscar role do `created_by`
- Se role = master/analyst -> chamar Edge Function com `direction = 'tridots_to_agency'`
- Se role e NULL (agencia) ou agency_user -> chamar Edge Function com `direction = 'agency_to_tridots'`

**Camada 2: Trigger SQL `notify_agency_new_ticket_message`**
Mesma logica bidirecional para respostas:
- Buscar role do `sender_id`
- Se master/analyst -> direction = 'tridots_to_agency'
- Se agency -> direction = 'agency_to_tridots'

**Camada 3: Edge Function `send-ticket-notification`**
Atualizar para aceitar novo campo `direction` no payload:
- `tridots_to_agency`: manter logica atual (e-mail para responsavel_email + assigned_to)
- `agency_to_tridots`: buscar todos users com role master/analyst na tabela `user_roles` + `profiles` para obter e-mails, enviar para cada um
- Criar `notifications` in-app para os destinatarios corretos (NAO para o remetente)

**Camada 4: Notificacao In-App**
- Inserir na tabela `notifications` com type = 'new_ticket' ou 'new_ticket_reply'
- Source = 'chamados' com reference_id = ticket_id
- Isso alimenta o NotificationCenter (sino) que ja existe no sistema

### Migracao SQL Necessaria
Nova migracao para recriar as duas funcoes trigger com logica bidirecional.

---

## Secao Tecnica - Resumo de Arquivos

| Arquivo | Tipo | Mudanca |
|---|---|---|
| `src/lib/utils.ts` | Frontend | Adicionar funcao `formatDateBR` |
| 61 componentes com `new Date()` | Frontend | Substituir por `parseISO` ou `formatDateBR` |
| `src/components/kanban/ApprovalModal.tsx` | Frontend | Recalcular garantia_anual quando taxa ajustada |
| `supabase/functions/validate-payments/index.ts` | Edge Function | Inferencia de plano, recalculo cascata, comissoes retroativas |
| `supabase/functions/generate-installments/index.ts` | Edge Function | Log de validacao do garantia_anual |
| `supabase/functions/send-ticket-notification/index.ts` | Edge Function | Logica bidirecional de destinatarios |
| `supabase/functions/_shared/email-templates.ts` | Edge Function | Correcao de datas nos templates de e-mail |
| Nova migracao SQL | Database | Triggers bidirecionais de notificacao de chamados |

## Ordem de Execucao

1. Criar funcao global `formatDateBR` e aplicar em massa (ITEM 1)
2. Corrigir ApprovalModal com recalculo de garantia_anual (ITEM 2 - Camada 1)
3. Corrigir validate-payments: inferencia de plano + recalculo cascata (ITENS 2 e 3)
4. Gerar comissoes retroativas para analise #2F62E17E (ITEM 3)
5. Atualizar triggers SQL + send-ticket-notification bidirecional (ITEM 4)
6. Deploy e verificacao de todas as funcoes

