

# Plano: Remover Auto-Preenchimento do Campo Referencia

## Problema Identificado

Na funcao `handleDateSelect` (linha 140-174), existe uma logica que automaticamente preenche o campo "Referencia" com o mes/ano da data selecionada no calendario de "Vencimento", caso o campo esteja vazio.

**Codigo responsavel (linhas 169-173):**
```typescript
// Auto-fill reference period based on due date
const item = items.find((i) => i.id === id);
if (item && !item.reference_period) {
  handleChange(id, 'reference_period', refPeriod);
}
```

Esse comportamento nao faz sentido porque:
- Vencimento e Referencia sao campos independentes
- Uma conta pode ter referencia de um mes e vencimento em outro
- Exemplo: Aluguel de 01/2026 pode vencer em 05/02/2026

---

## Solucao

Remover a logica de auto-preenchimento do campo de referencia baseada na data de vencimento.

---

## Arquivo Afetado

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/components/agency/claims/ClaimDebtTable.tsx` | Modificacao | Remover auto-fill do campo reference_period |

---

## Secao Tecnica

### Alteracoes no Codigo

**Remover linhas 165 e 169-173:**

```typescript
// ANTES (linhas 160-174)
// Usar componentes de data local para evitar problemas de timezone
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;
const refPeriod = `${month}/${year}`;

handleChange(id, 'due_date', formattedDate);

// Auto-fill reference period based on due date
const item = items.find((i) => i.id === id);
if (item && !item.reference_period) {
  handleChange(id, 'reference_period', refPeriod);
}

// DEPOIS
// Usar componentes de data local para evitar problemas de timezone
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;

handleChange(id, 'due_date', formattedDate);
```

---

## Resultado Esperado

Apos a correcao:
1. Selecionar uma data no calendario de Vencimento apenas preenche o campo de Vencimento
2. O campo Referencia permanece independente e nao eh afetado
3. O usuario deve preencher o campo Referencia manualmente

