

# Plano: Exclusão Cascata Master-Only (Análise, Contrato, Garantia)

## Contexto

Atualmente, `useDeleteAnalysis` bloqueia exclusão se existir contrato vinculado. O pedido é permitir que **apenas Masters** excluam análises com contratos, contratos individualmente, e garantias individualmente — com cascata total de registros filhos, preservando chamados com aviso de vínculo excluído.

**Regra de bloqueio**: Se houver garantia (claim) ativa vinculada ao contrato, o Master deve excluí-la primeiro antes de poder excluir o contrato/análise.

## Cadeia de Dados (o que será excluído)

```text
Análise
├── analysis_documents (+ arquivos no storage)
├── analysis_timeline
├── commissions
├── digital_acceptances
├── internal_notes (reference_id = analysis)
├── internal_chat
├── Contrato (contracts)
│   ├── guarantee_installments
│   ├── invoice_items → agency_invoices (se fatura só tem itens desse contrato)
│   ├── contract_renewals
│   ├── renewal_notifications
│   └── Garantia (claims) ← DEVE SER EXCLUÍDA ANTES
│       ├── claim_files (+ arquivos no storage)
│       ├── claim_items
│       ├── claim_notes
│       ├── claim_status_history
│       └── claim_timeline
└── Tickets (NÃO excluir — marcar vínculo como excluído)
```

## Alterações

### 1. Migração SQL — Coluna nos tickets + função de auditoria

- Adicionar `deleted_link_info jsonb DEFAULT NULL` na tabela `tickets` — armazena dados como `{ "entity_type": "analysis", "entity_id": "...", "deleted_at": "...", "deleted_by": "...", "tenant_name": "..." }` quando o vínculo é excluído
- Isso permite que a UI mostre o aviso "Este vínculo foi excluído em X por Y"

### 2. Nova Edge Function — `cascade-delete/index.ts`

Edge Function com service_role (bypassa RLS) que:
- Recebe `entity_type` (`analysis` | `contract` | `claim`), `entity_id`, e `user_id`
- Valida que o `user_id` é Master (consulta `user_roles`)
- Verifica bloqueios (claim ativa impede delete de contract/analysis)
- Executa a cascata na ordem correta:
  - Remove arquivos de storage (analysis-documents, claim-files)
  - Deleta registros filhos em ordem de dependência
  - Atualiza tickets vinculados com `deleted_link_info` (não os exclui)
  - Se deletando analysis com contrato: deleta contrato também
  - Se deletando contrato com faturas exclusivas: deleta faturas inteiras
  - Se fatura tem itens de outros contratos: remove só os itens desse contrato
  - Registra em `audit_logs` com dados completos (old_data com snapshot)
- Retorna resumo do que foi excluído (para o modal de confirmação usar na 1a etapa)
- Modo `dry_run = true` para a 1a etapa do modal (só retorna o que será excluído, sem excluir)

### 3. Hook — `useCascadeDelete.ts`

Hook React que:
- Expõe `fetchDeletionSummary(entityType, entityId)` — chama Edge Function com `dry_run: true`
- Expõe `executeDeletion(entityType, entityId)` — chama Edge Function com `dry_run: false`
- Invalida queries relevantes após exclusão

### 4. Componente — `CascadeDeleteModal.tsx`

Modal duplo:
- **Etapa 1**: Ao abrir, chama `dry_run` e mostra resumo: "Serão excluídos: 1 contrato, 3 parcelas, 2 comissões, 5 documentos, 1 fatura. 2 chamados serão preservados com aviso."
- **Etapa 2**: Botão "Confirmar Exclusão Definitiva" em vermelho, com texto explicativo
- Se houver claim bloqueando: mostra aviso "Exclua a garantia vinculada primeiro" com link para ela

### 5. UI — Botões de exclusão (master-only)

| Local | Alteração |
|-------|-----------|
| Drawer de análise (Kanban Tridots) | Adicionar botão "Excluir Análise" visível para Masters |
| `ContractDetail.tsx` | Adicionar botão "Excluir Contrato" visível para Masters |
| `ClaimDetail.tsx` | Adicionar botão "Excluir Garantia" visível para Masters |
| `useDeleteAnalysis` | Atualizar para usar a nova Edge Function ao invés da lógica client-side |

### 6. UI — Aviso nos chamados com vínculo excluído

| Local | Alteração |
|-------|-----------|
| `TicketDetail.tsx` / `TicketDetailSheet.tsx` | Se `ticket.deleted_link_info` não for null, mostrar banner amarelo: "A [análise/contrato/garantia] vinculada foi excluída em DD/MM/AAAA. O link original não está mais disponível." |
| `AgencyTicketDetail.tsx` | Mesmo banner no portal da imobiliária |

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | `deleted_link_info jsonb` em tickets |
| `supabase/functions/cascade-delete/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Registrar function |
| `src/hooks/useCascadeDelete.ts` | Novo hook |
| `src/components/shared/CascadeDeleteModal.tsx` | Novo componente modal duplo |
| `src/components/kanban/AnalysisDrawer.tsx` | Botão excluir (master) |
| `src/pages/ContractDetail.tsx` | Botão excluir (master) |
| `src/pages/ClaimDetail.tsx` | Botão excluir (master) |
| `src/hooks/useAnalyses.ts` | Refatorar `useDeleteAnalysis` |
| `src/components/tickets/TicketDetail.tsx` | Banner de vínculo excluído |
| `src/components/agency/AgencyTicketDetail.tsx` | Banner de vínculo excluído |

