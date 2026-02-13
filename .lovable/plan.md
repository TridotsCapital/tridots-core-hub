

# Plano de Ajustes - Drive, Anexos e Paste de Imagem

## 1. Drive de Documentos da Imobiliaria - Descricao no Card

**Arquivo:** `src/pages/agency/AgencyDocuments.tsx`

**O que muda:**
- Remover o botao de olho (Eye) que abre um Dialog com a descricao
- Remover o Dialog de descricao inteiro (linhas 218-248)
- Exibir a descricao diretamente no card, como subtitulo abaixo do nome do documento (estilo `CardDescription`, texto cinza menor), igual ao `DocumentCenter.tsx` da Tridots
- O card fica mais informativo sem precisar de clique extra

---

## 2. Corrigir Anexos nos Chamados - Chat da Imobiliaria

**Problema identificado:** O componente `AgencyTicketChatArea.tsx` nao possui botao de anexo nem renderiza `attachments_url` das mensagens. Alem disso, o bucket `chat-attachments` e **privado** (`public: false`) e usa `getPublicUrl()` no upload (que retorna URL inacessivel para bucket privado). As policies de storage so permitem `has_any_role()` (equipe Tridots) e `is_agency_user()`, mas falta policy de SELECT para agencias.

**Correcoes:**

### 2a. Bucket e Policies de Storage
- O bucket `chat-attachments` esta como `public: false`, mas o codigo usa `getPublicUrl()` que nao funciona em buckets privados
- **Solucao:** Alterar o bucket para `public: true` (os arquivos ja estao protegidos por policies de INSERT, e as URLs sao UUIDs aleatorios)
- Verificar que as policies de SELECT e INSERT existam para agency users

### 2b. Chat da Imobiliaria (AgencyTicketChatArea.tsx)
- Adicionar botao de clipe (Paperclip) ao lado do campo de mensagem
- Adicionar input file oculto para selecao de arquivos
- Implementar preview de arquivos pendentes (igual ao `TicketChatInput`)
- Fazer upload para o bucket `chat-attachments` antes de enviar
- Passar `attachments_url` no `sendMessage`
- Renderizar anexos nas mensagens recebidas (imagens inline clicaveis, arquivos com botao de download)

### 2c. Hook useSendTicketMessage
- Verificar que o hook aceita e salva `attachments_url` no campo da tabela `ticket_messages`

---

## 3. Colar Print (Paste) para Gerar Anexo

**Arquivos:** `src/components/tickets/TicketChatInput.tsx` + `src/components/agency/AgencyTicketChatArea.tsx`

**Implementacao:**
- Adicionar listener de `paste` no Textarea dos dois chats
- Quando o usuario cola uma imagem (Ctrl+V), interceptar o `clipboardData`
- Extrair os items do tipo `image/*` do clipboard
- Criar um `File` a partir do blob da imagem (nome automatico tipo `print-2026-02-13-14h30.png`)
- Adicionar ao array de `pendingFiles` com preview automatico
- O fluxo de upload segue igual ao botao de clipe

---

## Secao Tecnica - Arquivos Afetados

| # | Arquivo | Mudanca |
|---|---|---|
| 1 | `src/pages/agency/AgencyDocuments.tsx` | Remover botao Eye + Dialog, exibir descricao no card |
| 2 | `supabase/migrations/novo.sql` | Tornar bucket `chat-attachments` publico |
| 3 | `src/components/agency/AgencyTicketChatArea.tsx` | Adicionar anexos (upload, preview, renderizacao) |
| 4 | `src/components/tickets/TicketChatInput.tsx` | Adicionar listener de paste para imagens |
| 5 | `src/components/agency/AgencyTicketChatArea.tsx` | Adicionar listener de paste para imagens |

## Ordem de Execucao

1. Drive da imobiliaria (ajuste rapido de UI)
2. Migration para bucket publico
3. Refatorar chat da agencia com suporte a anexos
4. Implementar paste de imagem nos dois chats

