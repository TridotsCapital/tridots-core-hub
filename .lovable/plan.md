
# Ajustes no Boleto Unificado: Modal de Validacao, Grafico de Faturas e Usabilidade

## Resumo

Quatro ajustes distintos:
1. Modal de validacao no portal Tridots -- adaptar para Boleto Unificado
2. Grafico de colunas do modulo de faturas -- corrigir alturas e ampliar largura (ambos portais)
3. Botao "Gerar Fatura" -> "Ver Detalhes" no portal Tridots

---

## 1. Modal de Validacao de Pagamentos para Boleto Unificado

**Arquivo**: `src/components/kanban/AnalysisDrawer.tsx`

### Cenario A: Boleto Unificado + Setup NAO isento

O modal atualmente mostra "Data do Pagamento - Garantia" (campo editavel) + "Data do Pagamento - Taxa Setup" (campo editavel). Para Boleto Unificado:

- **Remover** o campo "Data do Pagamento - Garantia" (input date)
- **Adicionar** um card informativo destacado com icone de calendario mostrando:
  - Valor da parcela mensal (garantia_anual / 12)
  - Data do proximo vencimento (dia configurado da imobiliaria, ex: dia 05, 10 ou 15 do proximo mes)
  - Texto: "1a parcela da garantia"
- **Manter** o campo "Data do Pagamento - Taxa Setup"
- Na funcao `handleValidatePayments`, quando for `boleto_imobiliaria`, enviar `guaranteePaymentDate` como null (o backend ja deve lidar com isso)

### Cenario B: Boleto Unificado + Setup ISENTO

- O modal **nao aparece**. A ativacao ja e 100% automatica (implementada anteriormente).
- Verificar que a logica `paymentsPendingValidation` retorna `false` para esse cenario, pois o aceite automatico ja faz a ativacao completa.

### Dados necessarios

A imobiliaria possui o campo `boleto_vencimento_dia` (05, 10 ou 15). Preciso verificar se essa informacao esta disponivel no drawer. Caso nao, buscar a agencia vinculada para exibir a data correta.

---

## 2. Grafico de Colunas -- Corrigir Alturas Proporcionais

**Arquivo**: `src/components/invoices/MonthlyInvoiceChart.tsx`

**Problema identificado**: A funcao `getBarHeight` usa o valor retornado como `style={{ height: \`${barHeight}%\` }}` dentro de um container com `h-36` (144px). O calculo esta correto matematicamente, mas o container usa `flex items-end` com `h-36` e as barras usam `height` em percentual. O problema e que percentual em flexbox nao funciona corretamente sem um height explicito no container pai.

**Correcao**: Converter o calculo para usar pixels absolutos ao inves de percentual, baseado na altura do container (144px):

```
const getBarHeight = (value: number) => {
  if (value === 0) return 8; // px
  return Math.max(20, Math.round((value / maxValue) * 130)); // max 130px dentro de 144px
};
```

E alterar o style para usar `height` em pixels: `style={{ height: \`${barHeight}px\` }}`

---

## 3. Grafico de Colunas -- Barras Mais Largas (~70%)

**Arquivo**: `src/components/invoices/MonthlyInvoiceChart.tsx`

Ajustar o layout das barras para ocuparem ~70% do espaco disponivel:

- Reduzir gap de `gap-1` para `gap-0.5` no container das barras
- Aumentar `max-w` das barras de `max-w-[36px] sm:max-w-[44px]` para `max-w-[48px] sm:max-w-[60px]`
- Manter a responsividade com `flex-1 min-w-0`

---

## 4. Botao "Gerar Fatura" -> "Ver Detalhes" (Portal Tridots)

**Arquivo**: `src/pages/FinancialInvoices.tsx`

Na lista de imobiliarias (quadrante 2), o botao atualmente tem duas variantes:
- Se ja tem fatura: "Ver Detalhes" (navega para `/invoices/{id}`)
- Se nao tem fatura: "Gerar Fatura" (chama `handleGenerateForAgency`)

**Alteracao**: Substituir "Gerar Fatura" por "Ver Detalhes" que executa o mesmo comportamento do botao atual (gera a fatura automaticamente e abre o detalhe). Ou seja, manter a funcao `handleGenerateForAgency` mas apos gerar, redirecionar para o detalhe da fatura. Se a fatura ja existir, redirecionar diretamente.

Resultado: botao sempre mostra "Ver Detalhes", independentemente de ter fatura ou nao.

---

## Detalhes Tecnicos

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/kanban/AnalysisDrawer.tsx` | Adaptar modal de validacao para BU: remover campo garantia, adicionar card informativo, buscar dia vencimento da agencia |
| `src/components/invoices/MonthlyInvoiceChart.tsx` | Corrigir alturas proporcionais (px ao inves de %), ampliar largura das barras |
| `src/pages/FinancialInvoices.tsx` | Botao "Gerar Fatura" -> "Ver Detalhes" com mesmo comportamento |

### Busca de dados adicionais (AnalysisDrawer)

Para exibir a data de vencimento no card informativo, sera necessario acessar o `boleto_vencimento_dia` da agencia vinculada a analise. Provavelmente ja disponivel no objeto `analysis.agency` ou via query adicional.
