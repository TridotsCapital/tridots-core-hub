
# Boleto, codigo de barras e observacoes inline na pagina de faturas

## Objetivo
Mover a secao de boleto (download PDF, codigo de barras, observacoes) para dentro da pagina `/agency/invoices`, logo abaixo do grafico de meses e acima da tabela de parcelas. Sem navegacao para pagina separada.

## Mudancas

### 1. Hook `useMonthlyInvoiceSummary.ts` — expor campos do boleto

Adicionar `boleto_barcode` e `boleto_observations` ao select da query de `agency_invoices` (linha 68) e ao `MonthSummary`:

```text
MonthSummary {
  ...campos existentes
  boletoUrl?: string
  boletoBarcode?: string
  boletoObservations?: string
}
```

No mapeamento (linha 96-116), propagar esses campos para o MonthSummary do mes correspondente.

### 2. Pagina `AgencyInvoices.tsx` — secao inline de boleto

Substituir o card atual (linhas 90-125) que diz "Clique para ver boleto..." por uma secao completa inline com:

- **Botao "Baixar Boleto (PDF)"** — logica de download autenticado via `supabase.storage.download()` (mesma do AgencyInvoiceDetail)
- **Codigo de barras** com botao "Copiar" — exibido se `boletoBarcode` existir
- **Observacoes da Tridots** — bloco informativo se `boletoObservations` existir

Essa secao fica **entre o grafico e a tabela de parcelas**, na ordem:
1. Alerta de atraso (se houver)
2. Grafico de meses
3. **Secao de boleto** (novo, inline)
4. Tabela de parcelas

Se nao houver boleto no mes selecionado, a secao nao aparece (mesmo comportamento condicional).

### 3. Remover botao de navegacao

Eliminar o botao "Ver detalhes da fatura" e a referencia a `navigate(agencyPath('/invoices/...'))`. A pagina AgencyInvoiceDetail continua existindo para links de e-mail/notificacao, mas nao e mais promovida na UI.

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMonthlyInvoiceSummary.ts` | Adicionar `boleto_barcode`, `boleto_observations` ao select e ao MonthSummary |
| `src/pages/agency/AgencyInvoices.tsx` | Secao inline com download, barcode e observacoes; remover navegacao para detalhe |
