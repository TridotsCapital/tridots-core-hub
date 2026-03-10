

# Plano: Etiqueta "Migrado" + Correção da Timeline

## Diagnóstico da Timeline

Os eventos `manual_date_correction` **existem** na tabela `analysis_timeline` (4 registros confirmados). O código para exibi-los já foi adicionado nas duas páginas de detalhe. Possível causa de não aparecer: cache do navegador ou o deploy ainda não ter propagado. Vou verificar se há algum bug sutil no código — o código parece correto, mas vou garantir que está funcionando.

## Parte 1 — Adicionar coluna `is_migrated` na tabela `contracts`

Criar migração SQL:
```sql
ALTER TABLE contracts ADD COLUMN is_migrated boolean NOT NULL DEFAULT false;
```

Em seguida, marcar os 4 contratos migrados via insert tool:
```sql
UPDATE contracts SET is_migrated = true 
WHERE id IN ('5327229e-...', '94fb1f49-...', 'ae2f7477-...', 'fd8a05c6-...');
```

## Parte 2 — Badge "Migrado" na lista de contratos da Tridots

**Arquivo:** `src/components/contracts/ContractList.tsx`

Na coluna de Status (linha ~281), adicionar badge "Migrado" quando `contract.is_migrated === true`:
```tsx
{(contract as any).is_migrated && (
  <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 text-xs">
    <ArrowRightLeft className="h-3 w-3 mr-1" />
    Migrado
  </Badge>
)}
```

O hook `useContracts` já usa `select('*', ...)`, então `is_migrated` já vem nos dados — não precisa alterar o hook.

## Parte 3 — Badge "Migrado" na lista de contratos da Imobiliária

**Arquivo:** `src/components/agency/AgencyContractList.tsx`

Adicionar badge na coluna de Status (linha ~249). Porém, a query na página `AgencyContracts.tsx` seleciona campos específicos e não inclui `is_migrated`. Preciso adicionar `is_migrated` ao select da query.

**Arquivo:** `src/pages/agency/AgencyContracts.tsx` — adicionar `is_migrated` ao select da query (linha ~56).

**Arquivo:** Interface `Contract` em `AgencyContractList.tsx` — adicionar `is_migrated?: boolean`.

## Parte 4 — Badge "Migrado" no detalhe do contrato (Tridots)

**Arquivo:** `src/pages/ContractDetail.tsx`

No header (linha ~361), ao lado do badge de status, adicionar badge "Migrado" quando `(contract as any).is_migrated === true`. O hook `useContract` já usa `select('*')`.

## Parte 5 — Badge "Migrado" no detalhe do contrato (Imobiliária)

**Arquivo:** `src/components/agency/AgencyContractDetail.tsx`

A query busca `contracts` com `select('*')`, então `is_migrated` já vem. Adicionar badge no header (linha ~336) ao lado do badge de status.

## Resumo de arquivos

| Arquivo | Mudança |
|---------|---------|
| DB migration | `ALTER TABLE contracts ADD COLUMN is_migrated boolean DEFAULT false` |
| DB data (insert tool) | `UPDATE contracts SET is_migrated = true` nos 4 contratos |
| `src/pages/agency/AgencyContracts.tsx` | Adicionar `is_migrated` ao select |
| `src/components/agency/AgencyContractList.tsx` | Adicionar `is_migrated` à interface + badge "Migrado" |
| `src/components/contracts/ContractList.tsx` | Badge "Migrado" na coluna de status |
| `src/pages/ContractDetail.tsx` | Badge "Migrado" no header |
| `src/components/agency/AgencyContractDetail.tsx` | Badge "Migrado" no header |

