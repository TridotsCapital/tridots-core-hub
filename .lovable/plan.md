
# Correcao: Download e Visualizacao de Anexos nos Chamados

## Problema

Ao clicar em um arquivo PDF (ou outro nao-imagem) no chat, ele abre em nova aba mas nao oferece opcao de download. O comportamento esperado e ter **dois botoes**: um para **visualizar** (abrir em nova aba) e outro para **baixar** (download forcado no navegador).

## Solucao

Implementar download programatico via `fetch` + `Blob` (mesmo padrao ja usado no drive de documentos do projeto) e separar as acoes de "ver" e "baixar" em dois botoes distintos.

## Arquivos Afetados

| # | Arquivo | Mudanca |
|---|---------|---------|
| 1 | `src/components/tickets/TicketChatMessages.tsx` | Adicionar funcao de download programatico e dois botoes (visualizar + baixar) para anexos nao-imagem |
| 2 | `src/components/agency/AgencyTicketChatArea.tsx` | Mesma alteracao no chat do portal da imobiliaria |

## Detalhes Tecnicos

### Funcao de download programatico

Sera adicionada uma funcao `handleDownload(url)` em ambos os componentes que:
1. Faz `fetch` da URL do arquivo
2. Converte a resposta em `Blob`
3. Cria uma URL temporaria com `URL.createObjectURL`
4. Cria um elemento `<a>` invisivel com atributo `download` e o nome do arquivo
5. Simula o clique para forcar o download
6. Limpa a URL temporaria

### Layout do card de anexo nao-imagem

O card de arquivo passa a ter dois icones de acao:
- **Olho (Eye)**: abre o arquivo em nova aba para visualizacao
- **Download (Download)**: forca o download local do arquivo

Para imagens, o comportamento atual (clique abre em nova aba) sera mantido, pois ja funciona corretamente.
