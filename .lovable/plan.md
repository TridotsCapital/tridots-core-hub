
# Plano de Correção: Exibição de Parcelas e Controle de Faturas

## Resumo do Problema

Ao testar o fluxo com a imobiliária teste15@imobi15.com, foram identificados os seguintes problemas:

1. **Dia de vencimento não configurado** - A agência não tem `billing_due_day` definido, o que impede a geração de parcelas
2. **PaymentMethodDisplay não trata boleto_imobiliaria** - O componente exibe apenas o texto cru "boleto_imobiliaria" em vez de formatado
3. **Parcelas não foram geradas** - A edge function `generate-installments` falhou silenciosamente porque a agência não tinha dia de vencimento
4. **Módulo de faturas vazio** - Sem parcelas, não há itens para gerar faturas
5. **Falta baixa automática das parcelas** - Quando uma fatura é paga, as parcelas vinculadas não são atualizadas

---

## Correções a Implementar

### 1. PaymentMethodDisplay - Tratar boleto_imobiliaria

**Arquivo:** `src/components/payment/PaymentMethodDisplay.tsx`

**Problema:** O componente não tem um case específico para `boleto_imobiliaria`, cai no fallback que apenas exibe o texto cru.

**Correção:** Adicionar tratamento específico para exibir:
```
Boleto Unificado (via imobiliária) — 12x de R$ X (Total: R$ Y)
```

**Código:**
```typescript
// Handle boleto_imobiliaria
if (method === 'boleto_imobiliaria') {
  const parcelaMensal = garantiaAnual / 12;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Building2 className={`${iconSize[size]} text-primary shrink-0`} />
      <span className={`font-semibold ${sizeClasses[size]}`}>
        Boleto Unificado (via imobiliária) — 12x de {formatCurrency(parcelaMensal)}
      </span>
      <span className="text-sm text-muted-foreground">
        (Total: {formatCurrency(garantiaAnual)})
      </span>
    </div>
  );
}
```

---

### 2. Edge Function generate-installments - Tratar agência sem billing_due_day

**Arquivo:** `supabase/functions/generate-installments/index.ts`

**Problema:** Quando a agência não tem `billing_due_day`, a função retorna erro 400 e as parcelas não são geradas.

**Correção:** Usar um valor padrão (dia 10) quando não configurado, em vez de falhar. Isso permite que contratos sejam criados e depois atualizados quando a Tridots definir o dia correto.

**Alternativa escolhida:** Manter o erro mas com mensagem mais clara, pois a Tridots DEVE configurar o dia antes.

---

### 3. Botão "Gerar Rascunhos" no Módulo de Faturas

**Arquivo:** `src/pages/FinancialInvoices.tsx`

**Correção:** Adicionar botão que chama a edge function `generate-invoice-drafts` manualmente, permitindo:
- Selecionar mês/ano de referência
- Opcionalmente filtrar por agência
- Útil para testes e operação manual

**UI:**
- Botão "Gerar Rascunhos" no header junto aos filtros
- Dialog para selecionar parâmetros (mês, ano, agência opcional)
- Feedback de sucesso/erro com quantidade de faturas geradas

---

### 4. Baixa Automática das Parcelas

**Arquivo:** `src/hooks/useAgencyInvoices.ts` (mutation `useRegisterInvoicePayment`)

**Problema:** Ao registrar pagamento da fatura, as parcelas vinculadas não são atualizadas.

**Correção:** Após atualizar a fatura para `paga`:
1. Buscar todos os `invoice_items` da fatura
2. Para cada item, atualizar a parcela correspondente (`guarantee_installments`) com:
   - `status = 'paga'`
   - `paid_at = data do pagamento da fatura`

**Código adicional:**
```typescript
// Após marcar fatura como paga, atualizar parcelas vinculadas
const { data: items } = await supabase
  .from('invoice_items')
  .select('installment_id')
  .eq('invoice_id', invoiceId);

if (items && items.length > 0) {
  const installmentIds = items.map(i => i.installment_id).filter(Boolean);
  await supabase
    .from('guarantee_installments')
    .update({ 
      status: 'paga', 
      paid_at: new Date().toISOString() 
    })
    .in('id', installmentIds);
}
```

---

### 5. Reversão Completa no Cancelamento de Fatura

**Arquivo:** `src/hooks/useAgencyInvoices.ts` (mutation `useCancelInvoice`)

**Problema:** A lógica atual reverte status para 'pendente' mas não limpa `paid_at`.

**Correção:** Adicionar limpeza do campo `paid_at`:
```typescript
await supabase
  .from('guarantee_installments')
  .update({ status: 'pendente', invoice_item_id: null, paid_at: null })
  .eq('id', item.installment_id);
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/payment/PaymentMethodDisplay.tsx` | Adicionar case para `boleto_imobiliaria` com exibição formatada |
| `src/pages/FinancialInvoices.tsx` | Adicionar botão e dialog "Gerar Rascunhos" |
| `src/hooks/useAgencyInvoices.ts` | Baixa automática de parcelas + reversão completa |

---

## Detalhes Técnicos

### Exibição do Boleto Unificado
```text
Ícone Building2 | Boleto Unificado (via imobiliária) — 12x de R$ 583,33 (Total: R$ 7.000,00)
```

### Dialog Gerar Rascunhos
- Select para mês (1-12, padrão: mês atual)
- Select para ano (2024-2026, padrão: ano atual)
- Select opcional para agência específica
- Botão "Gerar" que chama a edge function
- Exibe resultado: "X faturas geradas para Y agências"

### Fluxo de Baixa de Pagamento
```text
1. Usuário marca fatura como "paga"
2. Hook atualiza agency_invoices.status = 'paga'
3. Hook busca invoice_items vinculados
4. Hook atualiza guarantee_installments para status = 'paga'
5. Timeline da fatura registra evento
6. Interface atualiza automaticamente via invalidação de queries
```

---

## Dependências e Pré-requisitos

Para que o sistema funcione corretamente:

1. **A agência DEVE ter `billing_due_day` configurado** antes de aprovar análises com boleto unificado
2. Se não tiver, o contrato será criado mas sem parcelas
3. A Tridots pode posteriormente:
   - Configurar o dia de vencimento no cadastro da agência
   - Chamar manualmente `generate-installments` para o contrato

---

## Resultado Esperado

Após implementação:
1. No quadrante "Custos da Garantia Tridots", boleto_imobiliaria exibe: `Boleto Unificado (via imobiliária) — 12x de R$ X (Total: R$ Y)`
2. Botão "Gerar Rascunhos" disponível no módulo de faturas Tridots
3. Ao registrar pagamento de fatura, parcelas são automaticamente marcadas como pagas
4. Ao cancelar fatura, parcelas voltam para pendente com paid_at limpo
5. Sistema funciona end-to-end quando agência tem billing_due_day configurado
