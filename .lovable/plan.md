
# Ajustes no Boleto Unificado: Cards, Aceite e Ativação Automática

## Resumo

Corrigir 3 problemas relacionados ao cenário **Boleto Unificado + Setup Isento**:
1. Cards do Kanban exibem "(1x)" ao invés de mostrar as parcelas
2. Link de aceite exibe steps desnecessários (dados do pagador)
3. Após aceite, a análise fica travada sem ativação

---

## 1. Cards do Kanban -- exibir parcelas do Boleto Unificado

**Problema**: A função `getPaymentMethodText()` nos cards não reconhece `boleto_imobiliaria`, caindo no fallback "(1x)".

**Solução**: Adicionar tratamento para `boleto_imobiliaria` em ambos os cards:

- **`src/components/kanban/KanbanCard.tsx`** (portal Tridots)
- **`src/components/agency/AgencyKanbanCard.tsx`** (portal Agência)

Na função `getPaymentMethodText()`, antes do fallback `return '(1x)'`, inserir:

```
if (analysis.forma_pagamento_preferida === 'boleto_imobiliaria') {
  const parcelaMensal = garantiaAnualFinal / 12;
  return `Boleto Unificado (12x de ${formatCurrency(parcelaMensal)})`;
}
```

---

## 2. Link de Aceite -- remover Step 2 para Boleto Unificado + Setup Isento

**Problema**: Quando Boleto Unificado + Setup Isento, o inquilino vê 2 steps (Termos + Confirmação). Como não há cobrança, o step de dados do pagador é desnecessário.

**Solução** em `src/pages/TenantAcceptance.tsx`:

- Reduzir para **1 step** quando `isBoletoUnificado && isSetupExempt`:
  ```
  totalSteps = 1;
  stepNames = ['Termos e Condições'];
  ```

- Alterar `handleStep1Submit` para, neste cenário, chamar o `submit-acceptance` com step `terms` e, logo após o sucesso, chamar novamente com step `acceptance_complete`, redirecionando direto para a tela de sucesso (`/aceite/{token}/sucesso`).

---

## 3. Ativação automática no backend -- criar contrato sem validação manual

**Problema**: No `submit-acceptance`, quando Boleto + Setup Isento, o `markAcceptanceComplete()` marca o token como usado e cria notificação de "aguardando validação", mas a análise fica travada em `aguardando_pagamento` pois a Tridots não consegue dar sequência.

**Solução** em `supabase/functions/submit-acceptance/index.ts`:

- Criar uma nova função `autoActivateAnalysis()` que executa a mesma lógica do `validate-payments` (action=validate), mas de forma automática:
  1. Atualiza status da análise para `aprovada`
  2. Define `payments_validated_at` (timestamp atual)
  3. Chama `create_contract_from_analysis` (RPC)
  4. Atualiza `payment_method` do contrato para `boleto_imobiliaria`
  5. Chama `generate-installments` para criar as 12 parcelas
  6. Registra evento na timeline: "Contrato ativado automaticamente (Boleto Unificado, Setup Isento)"
  7. Notifica os usuários da agência sobre a ativação

- No case `terms`, adicionar condição: se `isBoletoUnificado && isSetupExempt`, após salvar termos e foto, chamar `markAcceptanceComplete()` e `autoActivateAnalysis()`.

- Ajustar `markAcceptanceComplete()` para usar uma descrição diferente neste cenário: "Aceite concluído - Contrato ativado automaticamente" ao invés de "Aguardando validação".

---

## Detalhes Técnicos

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/kanban/KanbanCard.tsx` | Adicionar caso `boleto_imobiliaria` em `getPaymentMethodText()` |
| `src/components/agency/AgencyKanbanCard.tsx` | Mesmo ajuste acima |
| `src/pages/TenantAcceptance.tsx` | Reduzir steps para 1 no cenário BU+Isento; redirecionar para sucesso após Step 1 |
| `supabase/functions/submit-acceptance/index.ts` | Ativação automática no step `terms` quando BU+Isento |

### Fluxo atualizado (Boleto Unificado + Setup Isento)

```text
Inquilino abre link
       |
       v
  Step 1: Termos + Foto
       |
       v
  submit-acceptance (step=terms)
       |
       +-- Salva termos e foto
       +-- markAcceptanceComplete() -- marca token como usado
       +-- autoActivateAnalysis()
       |     +-- status -> "aprovada"
       |     +-- create_contract_from_analysis
       |     +-- payment_method -> "boleto_imobiliaria"
       |     +-- generate-installments (12 parcelas)
       |     +-- Notifica agência
       |
       v
  Tela de Sucesso
```
