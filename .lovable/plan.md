

# Plano: Correção de Build + Atualização em Massa dos Contratos CANAH IMÓVEIS

## Parte 1 — Corrigir erros de build (NodeJS.Timeout)

4 arquivos usam `NodeJS.Timeout` que não existe no contexto do projeto. Trocar por `ReturnType<typeof setTimeout>`:

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `src/components/tickets/TicketChatArea.tsx` | 34 | `useRef<NodeJS.Timeout>()` | `useRef<ReturnType<typeof setTimeout>>()` |
| `src/components/tickets/TicketDetail.tsx` | 32 | `useRef<NodeJS.Timeout>()` | `useRef<ReturnType<typeof setTimeout>>()` |
| `src/hooks/useAnalysisDraft.ts` | 64 | `useRef<NodeJS.Timeout \| null>(null)` | `useRef<ReturnType<typeof setTimeout> \| null>(null)` |
| `src/hooks/useClaimDraft.ts` | 38 | `useRef<NodeJS.Timeout \| null>(null)` | `useRef<ReturnType<typeof setTimeout> \| null>(null)` |

## Parte 2 — Atualização em massa dos 4 contratos

### Lógica de corte para parcelas

A **data de migração** de cada contrato é o `created_at` original do contrato no sistema TRIDOTS (antes de qualquer alteração). Parcelas com `due_date` anterior a essa data original serão marcadas como `paga`; as demais ficam `pendente`.

### Sequência de operações (via insert tool — SQL de dados)

Para cada um dos 4 contratos, executar na seguinte ordem:

1. **Consultar** o contrato e análise pelo prefixo do ID (ex: `id LIKE '94fb1f49%'`) para obter:
   - IDs completos do contrato e da análise
   - `created_at` original do contrato (= data de migração / corte)
   - `guarantee_payment_date` atual da análise
   - `data_fim_contrato` atual
   - Dados das parcelas existentes (valor, quantidade)

2. **Atualizar `analyses`**: setar `guarantee_payment_date` para a data de criação correta

3. **Atualizar `contracts`**: setar `created_at` para a data de criação correta e `data_fim_contrato` para a data de fim correta

4. **Parcelas (`guarantee_installments`)**:
   - Apagar parcelas existentes do contrato
   - Regerar 12 parcelas com base nas novas datas (início = data criação correta, intervalo mensal)
   - Parcelas com `due_date < created_at original do sistema` → status `paga`
   - Parcelas com `due_date >= created_at original do sistema` → status `pendente`

5. **Timeline (`analysis_timeline`)**: inserir evento `manual_date_correction` com metadata:
   ```json
   {
     "old_guarantee_payment_date": "...",
     "new_guarantee_payment_date": "...",
     "old_data_fim_contrato": "...",
     "new_data_fim_contrato": "...",
     "old_created_at": "...",
     "new_created_at": "...",
     "reason": "Migração CANAH IMÓVEIS — correção de prazos em massa",
     "migration_cutoff_date": "..."
   }
   ```

6. **Nota interna (`internal_notes`)**: inserir nota no contrato (`reference_type = 'contract'`) com texto explicativo da correção

### Dados da lista

| ID Curto | Inquilino | Criação Correta | Fim Correto |
|----------|-----------|-----------------|-------------|
| 94FB1F49 | Carlos Eduardo Capelini | 2025-10-29 | 2026-10-29 |
| AE2F7477 | Ediucio de Souza Silva | 2025-10-31 | 2026-10-31 |
| FD8A05C6 | Anne Raissa Melo Santos | 2026-01-06 | 2027-01-06 |
| 5327229E | Leonardo de Paula Silva | 2025-10-16 | 2026-10-16 |

## Parte 3 — Sinalização visual na UI

Adicionar o tipo `manual_date_correction` ao `timelineEventConfig` em `src/hooks/useAnalysisTimeline.ts` com cor laranja e ícone de edição, para que o evento apareça corretamente na timeline.

```typescript
manual_date_correction: {
  label: 'Correção Manual de Datas',
  color: 'text-orange-600',
  bgColor: 'bg-orange-100',
  iconName: 'Pencil',
}
```

## Resumo de arquivos afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/components/tickets/TicketChatArea.tsx` | Fix tipo NodeJS.Timeout |
| `src/components/tickets/TicketDetail.tsx` | Fix tipo NodeJS.Timeout |
| `src/hooks/useAnalysisDraft.ts` | Fix tipo NodeJS.Timeout |
| `src/hooks/useClaimDraft.ts` | Fix tipo NodeJS.Timeout |
| `src/hooks/useAnalysisTimeline.ts` | Adicionar config `manual_date_correction` |
| Banco de dados (via insert tool) | UPDATE em analyses, contracts; DELETE+INSERT em guarantee_installments; INSERT em analysis_timeline e internal_notes |

