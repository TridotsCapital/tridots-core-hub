

# Boleto: Download no Portal + Notificacoes + Campo de Observacao

## Problema

Quando a Tridots faz upload de um boleto para uma fatura:
1. A imobiliaria nao consegue baixar o PDF no portal (nenhum botao existe)
2. Nao recebe e-mail avisando que o boleto esta disponivel
3. Nao recebe notificacao in-app (sino)
4. Nao existe campo de observacao para a Tridots adicionar notas ao enviar o boleto

## Solucao Completa

### 1. Migracao SQL - Novo campo `boleto_observations`

Adicionar coluna `boleto_observations TEXT` na tabela `agency_invoices`:

```text
ALTER TABLE public.agency_invoices ADD COLUMN boleto_observations text;
```

### 2. BoletoUploadDialog - Campo de observacao + disparo de notificacao

**Arquivo:** `src/components/invoices/BoletoUploadDialog.tsx`

- Adicionar campo Textarea "Observacoes (opcional)" abaixo do codigo de barras
- Salvar o valor em `boleto_observations` no UPDATE da fatura
- Apos upload bem-sucedido, chamar a edge function `send-invoice-notification` com tipo `boleto_uploaded`
- Importar Textarea de `@/components/ui/textarea`

### 3. Portal da Imobiliaria - Botao de download + codigo de barras + observacoes

**Arquivo:** `src/pages/agency/AgencyInvoiceDetail.tsx`

Adicionar secao (Card) visivel quando `boleto_url` existir:
- Botao "Baixar Boleto" (download via `window.open` do `boleto_url`)
- Campo de codigo de barras com botao "Copiar" (se `boleto_barcode` existir)
- Observacoes da Tridots exibidas em bloco informativo (se `boleto_observations` existir)

### 4. Portal Tridots - Botao de reenvio de notificacao

**Arquivo:** `src/pages/InvoiceDetail.tsx`

Adicionar botao "Reenviar Notificacao" ao lado do botao "Ver Boleto", que chama `send-invoice-notification` com tipo `boleto_uploaded`.

### 5. Edge Function - Novo tipo `boleto_uploaded`

**Arquivo:** `supabase/functions/send-invoice-notification/index.ts`

- Adicionar `boleto_uploaded` ao tipo `notificationType`
- Buscar `boleto_url` da fatura para gerar link no e-mail
- Incluir observacoes no corpo do e-mail (se existirem)
- Criar signed URL temporaria (24h) para download seguro do PDF

**Arquivo:** `supabase/functions/_shared/email-templates.ts`

Adicionar template `boletoUploadedTemplate`:
- Assunto: "Boleto disponivel - Fatura MM/AAAA"
- Corpo: nome da imobiliaria, valor, vencimento, observacoes (se houver), botao "Baixar Boleto"

### 6. Notificacao In-App

Na edge function `send-invoice-notification`, apos envio do e-mail para tipo `boleto_uploaded`:
- Buscar todos os `agency_users` da imobiliaria
- Inserir notificacao em `ticket_notifications` para cada usuario com:
  - `type`: `boleto_available`
  - `title`: "Boleto disponivel"
  - `message`: "O boleto da fatura de MM/AAAA esta disponivel para download"

**Arquivo:** `src/types/notifications.ts`

Adicionar `'invoice_boleto_available'` ao `NotificationType` com config visual (icone FileDown, cor azul).

### 7. Atualizar types.ts

O arquivo `src/integrations/supabase/types.ts` sera regenerado automaticamente apos a migracao para incluir `boleto_observations`.

## Arquivos Afetados

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | `ADD COLUMN boleto_observations text` |
| `src/components/invoices/BoletoUploadDialog.tsx` | Campo observacao + disparo notificacao |
| `src/pages/agency/AgencyInvoiceDetail.tsx` | Download boleto + copiar barcode + observacoes |
| `src/pages/InvoiceDetail.tsx` | Botao reenviar notificacao |
| `supabase/functions/send-invoice-notification/index.ts` | Tipo `boleto_uploaded` |
| `supabase/functions/_shared/email-templates.ts` | Template `boletoUploadedTemplate` |
| `src/types/notifications.ts` | Novo tipo `invoice_boleto_available` |

## Fluxo Completo

```text
Tridots faz upload do boleto (BoletoUploadDialog)
  |
  v
1. Upload PDF no storage
2. UPDATE agency_invoices (boleto_url, boleto_barcode, boleto_observations, status)
3. Invoke send-invoice-notification({ type: boleto_uploaded })
  |
  v
Edge Function:
  a) Envia e-mail para imobiliaria com link + observacoes
  b) Insere notificacao in-app para usuarios da agencia
  |
  v
Imobiliaria:
  - Recebe e-mail com botao "Baixar Boleto"
  - Ve notificacao no sino do portal
  - Acessa detalhe da fatura: botao download, codigo de barras, observacoes
```

## Resultado Esperado

1. Campo de observacao disponivel no upload do boleto pela Tridots
2. Observacoes visiveis no portal da imobiliaria (se preenchidas)
3. E-mail automatico enviado no momento do upload
4. Botao de reenvio manual disponivel no portal Tridots
5. Notificacao in-app no sino da imobiliaria
6. Botao de download funcional no portal da imobiliaria
7. Codigo de barras copiavel no portal da imobiliaria

