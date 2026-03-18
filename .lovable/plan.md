

# Plano: Criar Notificações por E-mail para Garantias (Claims)

## Diagnóstico

As solicitações de garantia atualmente geram apenas **notificações in-app** (via triggers `create_claim_notifications` e `create_claim_status_notification` que inserem na tabela `notifications`). **Não existe nenhuma Edge Function nem trigger que envie e-mail** quando uma garantia é criada ou tem seu status alterado.

Comparando com o módulo de chamados (tickets), que possui:
- Edge Function `send-ticket-notification`
- Triggers com `net.http_post` chamando essa Edge Function
- Template de e-mail em `email-templates.ts`

O módulo de garantias **não tem nenhum desses componentes**.

## Alterações Necessárias

### 1. Template de e-mail — `email-templates.ts`

Adicionar duas funções de template:
- `claimCreatedTemplate(agencyName, tenantName, claimId)` — e-mail para masters da Tridots informando nova solicitação de garantia
- `claimStatusChangedTemplate(tenantName, oldStatus, newStatus, claimId)` — e-mail para a imobiliária informando mudança de status público

### 2. Nova Edge Function — `send-claim-notification/index.ts`

Criar Edge Function que:
- Recebe `claim_id`, `event_type` (`new_claim` | `status_changed`), e opcionalmente `old_status`/`new_status`
- Busca dados do claim (contrato, agência, inquilino)
- Para `new_claim`: envia e-mail para todos os masters ativos da Tridots
- Para `status_changed`: envia e-mail para o master da imobiliária (contato principal)
- Usa `sendAndLog` do `notification-utils.ts` para logging e notificação in-app
- Registrar em `config.toml` com `verify_jwt = false`

### 3. Triggers de banco — nova migração SQL

Criar duas funções trigger com `net.http_post`:

- `notify_claim_created_email()`: dispara AFTER INSERT em `claims`, chama `send-claim-notification` com `event_type = 'new_claim'`
- `notify_claim_status_changed_email()`: dispara AFTER UPDATE em `claims` quando `public_status` muda, chama `send-claim-notification` com `event_type = 'status_changed'`

Ambas usam `system_settings` para obter URL e service key (mesmo padrão dos tickets).

### 4. Deploy

Fazer deploy da nova Edge Function `send-claim-notification`.

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/email-templates.ts` | Adicionar 2 templates de claim |
| `supabase/functions/send-claim-notification/index.ts` | Criar Edge Function |
| `supabase/config.toml` | Adicionar config (verify_jwt = false) |
| Migração SQL | Criar 2 triggers com `net.http_post` |

