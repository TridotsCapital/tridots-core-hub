

# Correcao: Nome de Arquivo e Visualizacao Bloqueada nos Anexos

## Problemas Identificados

### 1. Nome do arquivo vira UUID
O upload usa `crypto.randomUUID()` como nome do arquivo no storage, perdendo o nome original. Exemplo: "Termos e condicoes Tridots Capital.pdf" vira "33bfa989-4b14-4664-8b3f-ff4fa67bc157.pdf".

### 2. Visualizacao bloqueada por ad-blockers
O botao "Visualizar" abre a URL direta do storage (`supabase.co/storage/...`), que e bloqueada por ad-blockers e extensoes de seguranca do Chrome (ERR_BLOCKED_BY_CLIENT).

## Solucao

### A) Upload com nome original no path (4 arquivos)

Alterar o caminho de upload de `${uuid}.${ext}` para `${uuid}__${sanitizedOriginalName}`, preservando o nome original no path do storage. A funcao `sanitizeFileName` ja existe no projeto (`useTermTemplates.ts`) e sera extraida para `src/lib/utils.ts` para reuso.

**Antes:**
```text
path = "33bfa989-4b14-4664-8b3f-ff4fa67bc157.pdf"
```

**Depois:**
```text
path = "33bfa989__Termos_e_condicoes_Tridots_Capital.pdf"
```

### B) Visualizacao via fetch+Blob (2 arquivos)

Substituir o link direto (`<a href={url} target="_blank">`) por uma funcao `handleView(url)` que:
1. Faz `fetch` da URL do arquivo
2. Converte em Blob
3. Abre via `URL.createObjectURL` em nova aba

Isso contorna o bloqueio de ad-blockers pois a nova aba abre uma URL `blob:` local, nao a URL do storage.

### C) Download com nome original (2 arquivos)

Melhorar a funcao `getFileName` para extrair o nome legivel quando o path usa o novo formato (`uuid__NomeOriginal.ext`), e tambem funcionar com arquivos antigos (apenas UUID).

## Arquivos Afetados

| # | Arquivo | Mudanca |
|---|---------|---------|
| 1 | `src/lib/utils.ts` | Exportar funcao `sanitizeFileName` para reuso |
| 2 | `src/components/tickets/TicketChatInput.tsx` | Upload com nome original no path |
| 3 | `src/components/agency/AgencyTicketChatArea.tsx` | Upload com nome original no path + funcao `handleView` via fetch+Blob + `getFileName` melhorado |
| 4 | `src/components/tickets/TicketChatMessages.tsx` | Funcao `handleView` via fetch+Blob + `getFileName` melhorado |
| 5 | `src/hooks/useChat.ts` | Upload com nome original no path (chat de analises) |

## Detalhes Tecnicos

### Funcao `handleView`
```text
async handleView(url):
  1. fetch(url) -> blob
  2. blobUrl = URL.createObjectURL(blob)
  3. window.open(blobUrl, '_blank')
```

### Funcao `getFileName` melhorada
```text
getFileName(url):
  filename = url.split('/').pop()
  se contem '__':
    retorna parte apos '__' (nome original)
  senao:
    retorna filename inteiro (fallback para arquivos antigos)
```

### Funcao `sanitizeFileName`
Ja existe em `useTermTemplates.ts`. Sera movida para `utils.ts`:
- Remove acentos via `.normalize("NFD")`
- Substitui espacos e caracteres especiais por underscore
- Remove underscores duplicados

### Nota sobre arquivos existentes
Arquivos ja enviados com nome UUID continuarao aparecendo com o UUID como nome. Apenas novos envios terao o nome original preservado. Isso e aceitavel pois nao ha como recuperar retroativamente os nomes originais.

