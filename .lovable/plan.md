
# Plano de Correção: Sistema Boleto Unificado

## Resumo Executivo
O sistema de Boleto Unificado foi parcialmente implementado, mas diversas funcionalidades criticas nao estao funcionando corretamente. Este plano corrige **todos** os problemas identificados no teste.

---

## Problema 1: Dia de Vencimento do Boleto

### Situacao Atual
- O campo `billing_due_day` existe na tabela `agencies` e e coletado no cadastro inicial (Step 5 do AgencySignupForm)
- **Faltante**: Nao existe campo para edicao em imobiliarias ja cadastradas no portal Tridots

### Correcao
**Portal Tridots** (`AgencyForm.tsx`): Adicionar campo Select para `billing_due_day` (opcoes: 05, 10, 15) na secao "Configuracoes de Comissao e Pagamento" (linha ~267)

**Portal Agencia** (`AgencyProfile.tsx`): Adicionar campo **somente leitura** mostrando o dia de vencimento configurado

**Hook** (`useAgencyProfile.ts`): Incluir `billing_due_day` na query (linha ~61) e na interface `AgencyProfileData`

---

## Problema 2: Exibicao de Valores no Boleto Unificado

### Situacao Atual
- No `PaymentOptionsDisplay.tsx` linha 81-86, a opcao `boleto_imobiliaria` mostra:
  - `description: 'Pagamento centralizado via imobiliaria'`
  - `value: garantiaAnual` (valor anual)
- Deveria mostrar **parcela mensal** como principal

### Correcao
**PaymentOptionsDisplay.tsx** (linha 78-86): Modificar a opcao `boleto_imobiliaria`:
```typescript
{
  id: 'boleto_imobiliaria',
  label: 'Boleto Mensal Unificado',
  description: `12x de ${formatCurrency(garantiaAnual / 12)}`,
  value: garantiaAnual / 12, // Parcela mensal
  subDescription: `(Total anual: ${formatCurrency(garantiaAnual)})`,
}
```

**Renderizacao** (linhas 249-256): Adicionar exibicao da subDescription para boleto_imobiliaria

---

## Problema 3: Modal de Aprovacao Tridots

### Situacao Atual (ApprovalModal.tsx)
- **Link Setup**: Exibe apenas se `isSetupRequired` (linha 62 e 270-287) - OK
- **Link Garantia**: Sempre exibe (linhas 289-305) - INCORRETO para boleto_imobiliaria
- `isFormValid()` sempre exige `guaranteePaymentLink` (linha 66)

### Logica Correta (matriz de condicoes)
| Setup Isento | Forma Pagamento | Campo Link Setup | Campo Link Garantia |
|--------------|-----------------|------------------|---------------------|
| Nao | Cartao/PIX | Aparece | Aparece |
| Sim | Cartao/PIX | Oculto | Aparece |
| Nao | Boleto Unificado | Aparece | Oculto |
| Sim | Boleto Unificado | Oculto | Oculto |

### Correcao
**ApprovalModal.tsx**:
1. Linha 131: Ja existe `formaPagamento = (analysis as any).forma_pagamento_preferida`
2. Adicionar variavel: `const isBoletoUnificado = formaPagamento === 'boleto_imobiliaria'`
3. Linha 64-68 - Ajustar `isFormValid()`:
```typescript
const isFormValid = () => {
  if (isSetupRequired && !setupPaymentLink.trim()) return false;
  if (!isBoletoUnificado && !guaranteePaymentLink.trim()) return false;
  return true;
};
```
4. Linhas 289-305: Envolver secao "Link Pagamento Garantia" em condicional `{!isBoletoUnificado && (...)}`
5. Linha 263-268: Se `isBoletoUnificado` e `!isSetupRequired`, exibir mensagem informativa em vez da secao de links
6. Linhas 82-88: Ajustar chamada edge function para nao enviar `guaranteePaymentLink` se boleto

---

## Problema 4: Link de Aceite do Inquilino

### Situacao Atual (TenantAcceptance.tsx)
- Linha 168-172: Calcula `totalSteps` e `stepNames` baseado apenas em `isSetupExempt`
- Sempre inclui "Pagamento Garantia" como ultimo step
- Para `boleto_imobiliaria`, nao ha pagamento do inquilino

### Logica Correta
| Setup Isento | Forma Pagamento | Steps |
|--------------|-----------------|-------|
| Nao | Cartao/PIX | Termos, Confirmacao, Pgto Setup, Pgto Garantia (4) |
| Sim | Cartao/PIX | Termos, Confirmacao, Pgto Garantia (3) |
| Nao | Boleto Unificado | Termos, Confirmacao, Pgto Setup (3) |
| Sim | Boleto Unificado | Termos, Confirmacao (2) |

### Correcao
**validate-acceptance-token (Edge Function)**: Incluir `forma_pagamento_preferida` na resposta para o frontend

**TenantAcceptance.tsx**:
1. Interface `AnalysisData` (linha 27): Ja tem `forma_pagamento_preferida`
2. Adicionar: `const isBoletoUnificado = analysis?.forma_pagamento_preferida === 'boleto_imobiliaria'`
3. Linhas 167-172: Ajustar calculo de steps:
```typescript
const isSetupExempt = analysis?.setup_fee_exempt || (analysis?.setup_fee || 0) <= 0;
const isBoletoUnificado = analysis?.forma_pagamento_preferida === 'boleto_imobiliaria';

// Determinar steps baseado nas duas condicoes
let totalSteps: number;
let stepNames: string[];

if (isBoletoUnificado) {
  if (isSetupExempt) {
    totalSteps = 2;
    stepNames = ['Termos e Condicoes', 'Confirmacao'];
  } else {
    totalSteps = 3;
    stepNames = ['Termos e Condicoes', 'Confirmacao', 'Pagamento Setup'];
  }
} else {
  if (isSetupExempt) {
    totalSteps = 3;
    stepNames = ['Termos e Condicoes', 'Confirmacao', 'Pagamento Garantia'];
  } else {
    totalSteps = 4;
    stepNames = ['Termos e Condicoes', 'Confirmacao', 'Pagamento Setup', 'Pagamento Garantia'];
  }
}
```
4. Ajustar `handleStep2Submit` (linha 387-388): Verificar se boleto_imobiliaria para determinar proximo step ou finalizacao
5. Ajustar a renderizacao dos steps para nao mostrar "Pagamento Garantia" quando boleto

**submit-acceptance (Edge Function)**:
1. Buscar `forma_pagamento_preferida` na query inicial (linha 55)
2. Adicionar novo step `acceptance_complete` para boleto_imobiliaria
3. No step `payer`: Se boleto_imobiliaria e setup isento, marcar como aceite completo
4. No step `setup_payment`: Se boleto_imobiliaria, marcar como aceite completo apos confirmar setup

**validate-acceptance-token (Edge Function)**:
1. Incluir `forma_pagamento_preferida` no select da query de analise
2. Retornar no objeto de resposta

---

## Problema 5: Geracao de Parcelas e Aba no Contrato

### Situacao Atual
- `ContractInstallmentsTab` existe e funciona
- `AgencyContractDetail.tsx` mostra aba Parcelas quando `payment_method === 'boleto_imobiliaria'`
- **Problema**: As parcelas nao sao geradas porque `validate-payments` nao chama `generate-installments`
- **Problema**: `ContractDetail.tsx` (portal Tridots) nao tem a aba Parcelas

### Correcao
**validate-payments/index.ts** (apos linha 106):
1. Buscar `forma_pagamento_preferida` da analise (ja tem na query)
2. Apos criar contrato, se `forma_pagamento_preferida === 'boleto_imobiliaria'`:
```typescript
if (analysis.forma_pagamento_preferida === 'boleto_imobiliaria') {
  console.log('Generating installments for boleto_imobiliaria contract...');
  const invokeResult = await supabase.functions.invoke('generate-installments', {
    body: { contract_id: contractId }
  });
  if (invokeResult.error) {
    console.error('Error generating installments:', invokeResult.error);
  } else {
    console.log('Installments generated successfully');
  }
}
```

**ContractDetail.tsx** (portal Tridots):
1. Importar `ContractInstallmentsTab`
2. Buscar `payment_method` do contrato na query
3. Adicionar aba "Parcelas" quando `payment_method === 'boleto_imobiliaria'`

---

## Problema 6: Modulo de Faturas Vazio

### Situacao Atual
- Tabelas existem, edge functions existem
- Nenhuma fatura foi gerada porque nenhum contrato foi ativado corretamente com boleto_imobiliaria

### Correcao
Este problema se resolve automaticamente quando os problemas 3-5 forem corrigidos:
1. Analise aprovada sem exigir link de garantia
2. Aceite completo sem step de pagamento de garantia
3. Contrato criado com `payment_method = 'boleto_imobiliaria'`
4. Parcelas geradas automaticamente
5. Cron job `generate-invoice-drafts` agrupa parcelas em faturas

**Adicional - Botao de teste** no `FinancialInvoices.tsx`:
- Adicionar botao "Gerar Rascunhos" que chama manualmente `generate-invoice-drafts` para facilitar testes

---

## Arquivos a Modificar

### Frontend
| Arquivo | Mudancas |
|---------|----------|
| `src/pages/AgencyForm.tsx` | Adicionar Select para `billing_due_day` |
| `src/pages/agency/AgencyProfile.tsx` | Adicionar display read-only do `billing_due_day` |
| `src/hooks/useAgencyProfile.ts` | Incluir `billing_due_day` na query |
| `src/components/payment/PaymentOptionsDisplay.tsx` | Exibir parcela mensal para boleto_imobiliaria |
| `src/components/kanban/ApprovalModal.tsx` | Ocultar link garantia quando boleto_imobiliaria |
| `src/pages/TenantAcceptance.tsx` | Ajustar steps dinamicos para boleto |
| `src/pages/ContractDetail.tsx` | Adicionar aba Parcelas quando boleto |
| `src/pages/FinancialInvoices.tsx` | Adicionar botao gerar rascunhos (teste) |

### Edge Functions
| Arquivo | Mudancas |
|---------|----------|
| `validate-acceptance-token/index.ts` | Incluir `forma_pagamento_preferida` na resposta |
| `submit-acceptance/index.ts` | Novo step `acceptance_complete` para boleto |
| `validate-payments/index.ts` | Chamar `generate-installments` para boleto |
| `generate-acceptance-link/index.ts` | Links opcionais quando boleto |

---

## Detalhes Tecnicos

### Logica de Deteccao
```typescript
const isBoletoUnificado = forma_pagamento_preferida === 'boleto_imobiliaria';
const isSetupRequired = !setup_fee_exempt && (setup_fee || 0) > 0;
```

### Fluxos de Aceite

**Boleto + Setup Isento (2 steps)**
```text
Step 1: Termos e Condicoes + Upload Documento
Step 2: Confirmacao Dados Pagador -> Aceite Completo
```

**Boleto + Setup NAO Isento (3 steps)**
```text
Step 1: Termos e Condicoes + Upload Documento  
Step 2: Confirmacao Dados Pagador
Step 3: Pagamento Setup -> Aceite Completo
```

**Cartao/PIX + Setup Isento (3 steps)**
```text
Step 1: Termos e Condicoes + Upload Documento
Step 2: Confirmacao Dados Pagador
Step 3: Pagamento Garantia -> Aceite Completo
```

**Cartao/PIX + Setup NAO Isento (4 steps)**
```text
Step 1: Termos e Condicoes + Upload Documento
Step 2: Confirmacao Dados Pagador
Step 3: Pagamento Setup
Step 4: Pagamento Garantia -> Aceite Completo
```

---

## Ordem de Implementacao
1. Corrigir exibicao de valores (PaymentOptionsDisplay)
2. Adicionar campo billing_due_day nos portais
3. Modificar ApprovalModal para boleto
4. Atualizar validate-acceptance-token para retornar forma_pagamento
5. Modificar TenantAcceptance para steps dinamicos
6. Modificar submit-acceptance para aceite completo
7. Conectar validate-payments com generate-installments
8. Adicionar aba Parcelas no ContractDetail (Tridots)
9. Adicionar botao teste gerar rascunhos

---

## Resultado Esperado
Apos implementacao:
1. Tridots define/edita dia de vencimento no cadastro da imobiliaria
2. Agencia visualiza (read-only) seu dia de vencimento no perfil
3. Opcao Boleto Unificado mostra "12x de R$ XXX (Total: R$ XXXX)"
4. Modal aprovacao Tridots exibe campos conforme matriz de condicoes
5. Aceite do inquilino tem steps dinamicos conforme forma pagamento e setup
6. Aceite boleto completa apos step de pagador ou setup (sem garantia)
7. Contrato criado automaticamente gera 12 parcelas
8. Parcelas aparecem na aba "Parcelas" em ambos portais
9. Cron job agrupa parcelas em faturas mensais
