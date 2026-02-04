
# Plano: Correcao do Bug de Timezone no Calendario de Debitos

## Problema Identificado

O calendario de data de vencimento na tabela de itens de debito esta exibindo o dia anterior ao selecionado. A causa eh a forma como a data armazenada (string "YYYY-MM-DD") eh convertida de volta para objeto Date.

**Codigo problematico (linhas 312 e 319):**
```typescript
// Linha 312 - Exibicao no botao
format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })

// Linha 319 - Definicao do dia selecionado no calendario
selected={item.due_date ? new Date(item.due_date) : undefined}
```

**Por que falha:** Quando `new Date("2026-02-05")` eh chamado, o JavaScript interpreta como meia-noite UTC. Em fusos horarios negativos (ex: Brasil GMT-3), isso resulta em `2026-02-04T21:00:00` localmente, exibindo o dia anterior.

---

## Solucao

Criar funcao auxiliar que parseia strings de data "YYYY-MM-DD" usando componentes locais, evitando a interpretacao UTC:

```typescript
// Parsear data local sem shift de timezone
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

---

## Arquivo Afetado

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/components/agency/claims/ClaimDebtTable.tsx` | Modificacao | Corrigir parsing de data para exibicao e selecao |

---

## Secao Tecnica

### Alteracoes no Codigo

**1. Adicionar funcao auxiliar (apos imports, linha ~32):**
```typescript
// Parse date string (YYYY-MM-DD) to local Date without timezone shift
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
```

**2. Corrigir exibicao no botao (linha 312):**
```typescript
// ANTES
format(new Date(item.due_date), 'dd/MM/yyyy', { locale: ptBR })

// DEPOIS
format(parseDateString(item.due_date), 'dd/MM/yyyy', { locale: ptBR })
```

**3. Corrigir selecao no calendario (linha 319):**
```typescript
// ANTES
selected={item.due_date ? new Date(item.due_date) : undefined}

// DEPOIS
selected={item.due_date ? parseDateString(item.due_date) : undefined}
```

---

## Resultado Esperado

Apos a correcao:
1. A data selecionada no calendario sera exibida corretamente no campo
2. O calendario marcara o dia correto como selecionado ao reabrir
3. Nao havera mais deslocamento de -1 dia causado por timezone
