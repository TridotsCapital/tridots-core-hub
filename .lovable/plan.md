

# Correcao: Boleto nao aparece no portal da imobiliaria + notificacoes falhando

## Diagnostico - 3 causas raiz encontradas

### Causa 1: Edge function quebrada (CRITICO)
A funcao `send-invoice-notification` esta **crashando no boot** com o erro:
```
The requested module '../_shared/email-templates.ts' does not provide an export named 'LOGO_BASE64'
```
No arquivo `email-templates.ts`, linha 10, o `LOGO_BASE64` e declarado como `const` mas **nao tem `export`**. A funcao importa esse simbolo na linha 11 do index.ts, causando falha imediata. Isso impede:
- Envio de e-mail para a imobiliaria
- Criacao de notificacoes in-app (sino)
- Qualquer outro tipo de notificacao de fatura

### Causa 2: Bucket privado com URL publica
O bucket `invoices` e **privado** (`public: false`), mas o `BoletoUploadDialog` salva a URL usando `getPublicUrl()`, que gera um link no formato `/storage/v1/object/public/invoices/...`. Esse link retorna **403 Forbidden** para qualquer usuario.

O download no portal da imobiliaria tenta extrair o path via regex e usar `supabase.storage.download()`, que depende de autenticacao e RLS do storage. Se nao houver policy de SELECT para agency users no bucket, o download falha silenciosamente.

### Causa 3: Dados existem no banco
Confirmei que os boletos JA estao salvos corretamente:
- Fatura `e8fc87b7`: tem `boleto_url` (sem barcode/observacoes)
- Fatura `fdb83cfd`: tem `boleto_url` + `boleto_barcode` + `boleto_observations`

A secao de boleto no portal (linhas 140-185 do AgencyInvoiceDetail) so renderiza se `invoiceAny.boleto_url` existir. O hook `useInvoiceDetail` usa `select('*')`, que deve retornar todos os campos incluindo boleto. Portanto, o problema visual pode ser RLS impedindo o download, nao a renderizacao.

## Plano de Correcao

### 1. Exportar `LOGO_BASE64` no email-templates.ts
**Arquivo:** `supabase/functions/_shared/email-templates.ts`

Alterar linha 10 de:
```
const LOGO_BASE64 = '...'
```
para:
```
export const LOGO_BASE64 = '...'
```

Isso corrige o crash da edge function e restaura todas as notificacoes (e-mail + in-app).

### 2. Corrigir o acesso ao boleto no bucket privado
**Arquivo:** `src/pages/agency/AgencyInvoiceDetail.tsx`

Trocar a logica de download para usar **signed URL via edge function** ou **download autenticado direto**. Como o bucket e privado, a abordagem mais segura:

- Extrair o path do storage a partir da URL salva (remover o prefixo do Supabase URL)
- Usar `supabase.storage.from('invoices').download(path)` que ja usa o token do usuario logado
- Se falhar (sem RLS), usar fallback via `createSignedUrl` no backend

### 3. Garantir RLS no bucket invoices para agency users
**Migracao SQL**

Verificar e criar policy de SELECT no `storage.objects` para que usuarios da agencia possam baixar boletos das suas proprias faturas:

```text
CREATE POLICY "Agency users can download their invoices boletos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = 'boletos'
  AND EXISTS (
    SELECT 1 FROM agency_invoices ai
    JOIN agency_users au ON au.agency_id = ai.agency_id
    WHERE au.user_id = auth.uid()
    AND ai.id::text = (storage.foldername(name))[2]
  )
);
```

### 4. Redesplegar a edge function
Apos a correcao do export, redesplegar `send-invoice-notification` para que pare de crashar.

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/_shared/email-templates.ts` | Adicionar `export` ao `LOGO_BASE64` |
| `src/pages/agency/AgencyInvoiceDetail.tsx` | Ajustar logica de download para bucket privado |
| Migracao SQL | RLS policy para agency users no bucket invoices |

## Resultado esperado

1. Edge function `send-invoice-notification` volta a funcionar (sem crash no boot)
2. E-mails de boleto enviados automaticamente ao fazer upload
3. Notificacoes in-app criadas para usuarios da agencia
4. Botao "Baixar Boleto" funcional no portal da imobiliaria
5. Codigo de barras e observacoes visiveis no detalhe da fatura

