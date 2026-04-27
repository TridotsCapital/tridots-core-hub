

# Plano: Rebrand Tridots → GarantFácil (apenas texto visível)

## Escopo confirmado

- **Substituir**: todas as ocorrências de "Tridots" / "Tridots Capital" / "TRIDOTS CAPITAL" / "TRIDOTS" em **texto exibido ao usuário** por **"GarantFácil"**.
- **Razão social** (somente em blocos legais — termo de aceite e rodapés de PDF): **"GarantFácil Serviços de Cobranças Ltda"** com **CNPJ 33.794.683/0001-55** (substitui "TRIDOTS SOLUTIONS LTDA / CNPJ 54.409.383/0001-85").
- **NÃO mexer**: variáveis (`tridotsUsers`, `TRIDOTS_BLUE`), constantes, env vars (`TRIDOTS_NOTIFICATIONS_EMAIL`), coluna do banco (`rate_adjusted_by_tridots`), domínios (`tridotscapital.com`, `aceite.tridotscapital.com` etc.), nomes de arquivos (`logo-tridots-black.webp`), comentários de código, e-mails remetentes (`naoresponder@tridotscapital.com`).
- **Logo**: arquivo permanece o mesmo; apenas o atributo `alt="Tridots Capital"` será atualizado para `alt="GarantFácil"`.

## Regras de substituição

| Texto atual | Substituir por |
|---|---|
| `Tridots Capital` / `TRIDOTS CAPITAL` | `GarantFácil` (ou `GARANTFÁCIL` em caixa alta de títulos/PDFs) |
| `Tridots` (isolado, em frases) | `GarantFácil` |
| `equipe Tridots` / `Suporte Tridots` / `Central Tridots` | `equipe GarantFácil` / `Suporte GarantFácil` / `Central GarantFácil` |
| `pela Tridots`, `da Tridots`, `na Tridots`, `à Tridots`, `com a Tridots` | `pela GarantFácil`, `da GarantFácil`, `na GarantFácil`, `à GarantFácil`, `com a GarantFácil` |
| `TRIDOTS SOLUTIONS LTDA` | `GarantFácil Serviços de Cobranças Ltda` |
| `CNPJ: 54.409.383/0001-85` | `CNPJ: 33.794.683/0001-55` |
| Cláusulas do termo: `TRIDOTS`, `serviços TRIDOTS` | `GARANTFÁCIL`, `serviços GARANTFÁCIL` (mantendo o estilo em caixa alta original do contrato jurídico) |
| Atributos `alt="Tridots Capital"` em `<img>` | `alt="GarantFácil"` |

## Arquivos afetados (visão por categoria)

### 1. Frontend — UI exibida ao usuário (~25 arquivos)
- **Páginas**: `src/pages/TenantAcceptance.tsx` (95 ocorrências, inclui termo jurídico completo + bloco GARANTIDOR), `src/pages/AcceptanceSuccess.tsx`, `src/pages/RenewalAcceptance.tsx`, `src/pages/RenewalAcceptanceSuccess.tsx`, `src/pages/ResetPassword.tsx`, `src/pages/Auth.tsx`, `src/pages/agency/AgencyDashboard.tsx`, `src/pages/agency/AgencyNewAnalysis.tsx`, `src/pages/agency/AgencyDocuments.tsx`, `src/pages/agency/AgencyProfile.tsx`, `src/pages/agency/AgencyInvoiceDetail.tsx`, `src/pages/agency/AgencyHelp.tsx`, `src/pages/agency/AgencySupport.tsx`, `src/pages/TicketCenter.tsx`.
- **Componentes**: `src/components/auth/AgencySignupForm.tsx`, `src/components/auth/TeamSignupForm.tsx`, `src/components/users/AddUserDialog.tsx`, `src/components/agency/GuaranteeSimulator.tsx`, `src/components/agency/ContractRenewalModal.tsx`, `src/components/agency/NewAnalysisSteps/PropertyStep.tsx`, `src/components/agency/PendingApprovalBanner.tsx`, `src/components/agency/BillingBlockedBanner.tsx`, `src/components/contracts/ContractRenewalTab.tsx`, `src/components/contracts/TridotsRenewalModal.tsx` (apenas strings visíveis; nome do arquivo/componente fica), `src/components/payment/PaymentMethodDisplay.tsx`, `src/components/help-admin/*` (textos visíveis se houver).
- **Hooks visíveis ao usuário**: `src/hooks/useAuditLogs.ts` (linha 151: rótulo "Tridots Capital" exibido na UI de auditoria).

### 2. Conteúdo embutido (manuais, help, seed)
- `src/lib/help-seed-data.ts` — todo o conteúdo do Help Center (capítulos, tips, FAQs).
- `supabase/functions/upload-manual-document/index.ts` — `MANUAL_CONTENT` completo.

### 3. E-mails transacionais (HTML e cópias visíveis)
- `supabase/functions/_shared/email-templates.ts` — todos os templates HTML (subjects, corpo, assinaturas). **Manter** o nome da constante `TRIDOTS_BLUE`/`TRIDOTS_ACCENT` (são identificadores) e o remetente `naoresponder@tridotscapital.com`. Trocar somente o texto visível: títulos, parágrafos, "Equipe Tridots Capital" → "Equipe GarantFácil", `from: 'Tridots Capital <...>'` → `from: 'GarantFácil <...>'` (a parte do display name é visível).
- `supabase/functions/send-renewal-notification/index.ts` — `subject` e `from` (display name).
- Demais funções com `subject`/HTML inline: `send-agency-activation`, `send-claim-notification`, `send-invoice-notification`, `send-payment-confirmation`, `send-ticket-notification`, `send-contract-activated`, `send-weekly-commission-report`, `send-claim-deadline-alert`, `send-new-agency-notification`, `test-email-notifications`.

### 4. PDFs gerados
- `supabase/functions/generate-invoice-pdf/index.ts` — `<h1>TRIDOTS CAPITAL</h1>` → `<h1>GARANTFÁCIL</h1>`, rodapé "sistema Tridots Capital" → "sistema GarantFácil".
- `supabase/functions/generate-invoice-excel/index.ts` — strings visíveis em cabeçalhos/rodapés.

### 5. Metadata / SEO
- `index.html` — `<title>`, `<meta name="description">`, `<meta name="author">`, `og:title`, `og:description`, `twitter:title`, `twitter:description`. **Não** trocar `og:image` (URL do domínio).

## O que NÃO será alterado (intencional)

- Domínios: `tridotscapital.com`, `aceite.tridotscapital.com`, `app.tridotscapital.com`, `portal.tridotscapital.com`, `tridots-core-hub.lovable.app`.
- E-mails remetentes/destinatários técnicos: `naoresponder@tridotscapital.com`, `cadastros@tridotscapital.com`, `testes@tridotscapital.com`, `testes@tridots.com.br`, `seu@tridots.com.br` (placeholder).
- Env vars: `TRIDOTS_NOTIFICATIONS_EMAIL`, `ACCEPTANCE_BASE_URL`.
- Identificadores de código: `TRIDOTS_BLUE`, `TRIDOTS_ACCENT`, `tridotsUsers`, `tridotsEmail`, `logoTridots`, `logoBlack`, `TridotsRenewalModal`, `request_source: 'tridots'`.
- Coluna do banco: `rate_adjusted_by_tridots`.
- Arquivos de logo: `logo-tridots-black.webp`, `logo-tridots-white.webp`.
- Comentários iniciados com `//` ou `/* */` no código.
- Documentos gerados em `/mnt/documents/` (relatórios criados em mensagens anteriores).

## Cuidados especiais

- **Termo jurídico de aceite** (`TenantAcceptance.tsx`, lines 745–869): cláusulas usam `TRIDOTS` em caixa alta como nome contratual da parte. Será trocado para `GARANTFÁCIL` mantendo o estilo. O bloco GARANTIDOR no fim do termo recebe a nova razão social e CNPJ.
- **WhatsApp**: a frase "Tridots Capital pelo WhatsApp (44) 9 9177-8859" vira "GarantFácil pelo WhatsApp (44) 9 9177-8859" (número mantido).
- **`useAuditLogs.ts`** linha 151: o literal `"Tridots Capital"` é exibido na UI como rótulo de organização — será trocado para `"GarantFácil"`.
- **Subject de e-mail** com `Tridots Capital` no fim (ex.: `... - Tridots Capital`) é visível ao destinatário → trocar.
- **Memória do projeto** (`mem://...`): será atualizada uma nova entrada `mem://branding/garantfacil-rebrand` registrando: marca = GarantFácil, razão social = GarantFácil Serviços de Cobranças Ltda, CNPJ = 33.794.683/0001-55, garantidor antigo (Tridots Solutions / 54.409.383/0001-85) substituído. Memórias existentes que mencionam "Tridots" como entidade visível ao usuário receberão nota de rebrand no índice.

## Execução

1. Criar tarefas no tracker (1 por categoria de arquivo).
2. Aplicar substituições em lote por arquivo, preservando capitalização contextual (caixa alta em títulos/cláusulas, caixa natural em frases).
3. Validar visualmente trechos críticos: termo de aceite, e-mail de boas-vindas, PDF de fatura, manual.
4. Atualizar `mem://index.md` + criar `mem://branding/garantfacil-rebrand`.

## Não inclui

- Troca de logo (arquivo de imagem).
- Troca de domínios ou env vars.
- Renomeação de variáveis, componentes (`TridotsRenewalModal`), arquivos ou colunas.
- Alteração de e-mails remetentes técnicos.
- Reescrita dos documentos `.md` já entregues em `/mnt/documents/`.

