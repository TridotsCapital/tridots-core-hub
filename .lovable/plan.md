

# Plano: Alerta Escalonado de Prazo de 30 Dias para Garantias

## Contexto

A Tridots deve pagar o sinistro à imobiliária em até 30 dias após a abertura (`claims.created_at`). A equipe precisa ser alertada de forma escalonada para evitar atrasos.

## Regras de Negócio

- **Alertas escalonados**: 1o alerta no **20o dia** (faltam 10), 2o no **27o dia** (faltam 3), 3o no **29o dia** (falta 1)
- **Canais**: In-app (tabela `notifications`) + E-mail (via Edge Function)
- **Destinatários**: Todos os masters e analysts ativos
- **Status monitorados**: Todas as garantias exceto `finalizado` (público)
- **Controle de duplicidade**: Coluna `claim_deadline_alerts_sent` (jsonb) na tabela `claims` para rastrear quais alertas já foram enviados, evitando reenvio

## Alterações

### 1. Migração SQL — Coluna de controle + Função de verificação

- Adicionar coluna `claim_deadline_alerts_sent jsonb DEFAULT '[]'` na tabela `claims`
- Criar função `check_claim_deadline_alerts()` que:
  - Seleciona claims com `public_status != 'finalizado'` e calcula dias desde `created_at`
  - Para cada threshold (20, 27, 29 dias), verifica se já foi enviado via `claim_deadline_alerts_sent`
  - Insere notificação in-app para masters e analysts
  - Chama `net.http_post` para a Edge Function de e-mail
  - Atualiza `claim_deadline_alerts_sent` com o threshold enviado

### 2. Nova Edge Function — `send-claim-deadline-alert/index.ts`

- Recebe `claim_id`, `days_elapsed`, `days_remaining`
- Busca dados do claim (contrato, inquilino, imobiliária, valor)
- Envia e-mail para todos os masters e analysts ativos com template de urgência escalonada:
  - 10 dias restantes: tom informativo (amarelo)
  - 3 dias restantes: tom de alerta (laranja)
  - 1 dia restante: tom urgente (vermelho)
- Usa `sendAndLog` do `notification-utils.ts`
- Adicionar em `config.toml` com `verify_jwt = false`

### 3. Template de e-mail — `email-templates.ts`

Adicionar função `claimDeadlineAlertTemplate(params)` com:
- Nome do inquilino, imobiliária, valor reclamado
- Dias restantes em destaque visual
- Link direto para o detalhe da garantia
- Cor do banner de urgência variável (amarelo/laranja/vermelho)

### 4. Cron Job — Execução diária

Agendar via `pg_cron` (INSERT tool, não migração) para rodar diariamente às 8h UTC:
```
SELECT cron.schedule('check-claim-deadlines', '0 8 * * *', $$SELECT check_claim_deadline_alerts()$$);
```

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Coluna `claim_deadline_alerts_sent` + função `check_claim_deadline_alerts()` |
| `supabase/functions/send-claim-deadline-alert/index.ts` | Nova Edge Function |
| `supabase/functions/_shared/email-templates.ts` | Template escalonado |
| `supabase/config.toml` | Registrar nova function |
| SQL (insert tool) | Cron job diário |

