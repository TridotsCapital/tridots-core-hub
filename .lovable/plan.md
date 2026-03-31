

# Plano: Correção Definitiva do Cascade-Delete

## Diagnóstico Confirmado

### Causa raiz dos erros "non-2xx"
A tabela `invoice_items` tem FK `invoice_items_contract_id_fkey` com `ON DELETE RESTRICT`. A função só remove itens encontrados via `guarantee_installments.invoice_item_id`, mas **não remove itens ligados diretamente por `contract_id`** que não passaram por installments. Esses itens bloqueiam a exclusão do contrato.

Da mesma forma, `claims_contract_id_fkey` é `NO ACTION` (RESTRICT por padrão) e `commissions_analysis_id_fkey` é `ON DELETE RESTRICT`. Se qualquer falha silenciosa ocorrer na deleção de filhos, o pai fica bloqueado.

### Análises órfãs
13 análises com status `aprovada` sem contrato vinculado (resíduo de exclusões parciais anteriores).

---

## Correções (3 frentes)

### 1. Migração SQL — blindagem de FKs

Alterar FKs problemáticas para `ON DELETE CASCADE` como rede de segurança:

| FK | Tabela | Ação atual | Nova ação |
|---|---|---|---|
| `claims_contract_id_fkey` | claims → contracts | NO ACTION | CASCADE |
| `guarantee_installments_contract_id_fkey` | guarantee_installments → contracts | RESTRICT | CASCADE |
| `invoice_items_contract_id_fkey` | invoice_items → contracts | RESTRICT | CASCADE |
| `commissions_analysis_id_fkey` | commissions → analyses | RESTRICT | CASCADE |
| `contracts_analysis_id_fkey` | contracts → analyses | RESTRICT | CASCADE |

Isso garante que mesmo que a função falhe em algum passo, o banco não bloqueia.

### 2. Edge Function — cobrir invoice_items diretos + internal_chat

No `deleteContractChildren`:
- **Após** o cleanup via installments, adicionar: deletar **todos** `invoice_items` restantes por `contract_id` diretamente
- Recalcular/excluir faturas afetadas por esses itens extras

No `deleteAnalysisChildren`:
- Adicionar limpeza de `internal_chat` por `analysis_id` (hoje depende apenas do CASCADE)

### 3. Limpeza de dados — análises órfãs

Usar insert tool para deletar as 13 análises órfãs e seus filhos (documentos, timeline, comissões, aceites, notas internas, internal_chat, notificações).

### 4. Melhorar feedback no modal

No `BulkDeleteContractsModal`, capturar a mensagem de erro real retornada pela edge function (campo `data.error`) e exibir no resultado por contrato, em vez do genérico "Falha ao excluir".

No `useCascadeDelete.executeDeletion`, quando `error` vem do invoke, extrair `data?.error` e lançar com a mensagem real.

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| Nova migração SQL | ALTER FK × 5 para ON DELETE CASCADE |
| `supabase/functions/cascade-delete/index.ts` | Adicionar cleanup de `invoice_items` por `contract_id` + `internal_chat` |
| `src/hooks/useCascadeDelete.ts` | Propagar mensagem de erro real |
| `src/components/contracts/BulkDeleteContractsModal.tsx` | Exibir erro detalhado por contrato |
| Dados (insert tool) | Deletar 13 análises órfãs + filhos |

