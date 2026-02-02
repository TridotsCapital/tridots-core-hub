
# Plano: Permitir Chamados para Todas as Imobiliárias (Incluindo Inativas)

## Problema Identificado

O diálogo de criação de chamados (`NewTicketDialog.tsx`) carrega apenas imobiliárias ativas na linha 91:

```typescript
.eq('active', true)
```

Isso impede a Tridots de enviar chamados para imobiliárias que ainda estão em processo de ativação.

## Solucao

Remover o filtro de imobiliárias ativas no componente `NewTicketDialog`, permitindo que **todas** as imobiliárias apareçam na lista de seleção. Para melhorar a usabilidade, vou adicionar um indicador visual (badge) para distinguir imobiliárias ativas das inativas.

## Modificacoes

**Arquivo: `src/components/tickets/NewTicketDialog.tsx`**

| Linha | Antes | Depois |
|-------|-------|--------|
| 91 | `.eq('active', true)` | (removido) |
| 28-32 | Interface Agency sem `active` | Adicionar campo `active: boolean` |
| 232-236 | SelectItem simples | SelectItem com badge "Pendente" para inativas |

### Detalhes da Implementacao

1. **Atualizar interface Agency** para incluir o campo `active`
2. **Remover filtro** `.eq('active', true)` da consulta
3. **Adicionar `active` no select** da consulta
4. **Exibir badge visual** "Pendente" ao lado de imobiliárias inativas na lista

### Visualizacao do Resultado

```text
+----------------------------------+
| Selecionar imobiliária...        |
+----------------------------------+
| [ Buscar imobiliária... ]        |
+----------------------------------+
| [Building] Imobiliária ABC       |
| [Building] Imobiliária XYZ [Pendente] |  <- inativa, com badge
| [Building] Outra Imobiliária     |
+----------------------------------+
```

---

## Secao Tecnica

### Codigo da consulta atualizada (linhas 88-93)

```typescript
const { data } = await supabase
  .from('agencies')
  .select('id, nome_fantasia, razao_social, active')
  .order('razao_social', { ascending: true });
```

### Badge para inativas (dentro do SelectItem)

```tsx
{getAgencyDisplayName(agency)}
{!agency.active && (
  <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
    Pendente
  </Badge>
)}
```
