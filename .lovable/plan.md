
# Correções no Link de Aceite para Boleto Unificado

## Resumo

Dois ajustes no fluxo de aceite do inquilino quando a forma de pagamento e Boleto Unificado:

1. **Texto "Forma de pagamento Garantia"** no resumo do Step 1 mostra "Nao Definida" para boleto unificado -- corrigir para "Pago juntamente com aluguel"
2. **Step 4 (Pagamento da Garantia)** nao deve existir para Boleto Unificado -- atualmente causa erro ao tentar confirmar, e a logica de retomada de sessao envia incorretamente para o step 4

---

## Alteracoes

### 1. Texto do Resumo dos Valores (TenantAcceptance.tsx)

**Problema**: No bloco que renderiza a "Forma de pagamento Garantia" (linhas 697-724), o codigo verifica `pix` e `card_Nx`, mas nao trata `boleto_imobiliaria`, caindo no fallback "Nao definida".

**Correcao**: Adicionar tratamento para `boleto_imobiliaria` retornando `"Pago juntamente com aluguel"`, antes do fallback.

### 2. Remover Step 4 para Boleto Unificado (TenantAcceptance.tsx)

**Problema**: A estrutura de steps (linhas 175-195) ja esta correta (3 steps para Boleto + setup nao isento, sem step de garantia). Porem, a **logica de retomada de sessao** (linhas 240-244) tem um bug:

```text
if (setup_payment_confirmed_at && !setup_fee_exempt) {
  setCurrentStep(4);  // BUG: ignora forma de pagamento
}
```

Quando o inquilino ja pagou o setup e recarrega a pagina, o sistema envia para o step 4 independentemente de ser Boleto Unificado. Como o step 4 nao existe para boleto, causa o erro.

**Correcao**: Ajustar a logica de retomada para considerar `isBoletoUnificado`:

```text
if (setup_payment_confirmed_at && !setup_fee_exempt) {
  if (boleto_imobiliaria) {
    -> redirecionar para sucesso (ja concluiu)
  } else {
    -> setCurrentStep(4) (pagamento da garantia)
  }
}
```

### 3. Backend: Boleto + Setup NAO isento (submit-acceptance/index.ts)

A logica do `setup_payment` case (linha 316) ja faz `markAcceptanceComplete()` quando `isBoletoUnificado`, o que esta correto. Nenhuma alteracao necessaria no backend.

---

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/TenantAcceptance.tsx` | (1) Adicionar `boleto_imobiliaria` no resumo dos valores; (2) Corrigir logica de retomada de sessao para nao enviar boleto ao step 4 |
