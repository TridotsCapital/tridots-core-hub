

# Plano: Corrigir Favicon e Metadados para Google

## Problema

O favicon atual aponta para uma URL do Lovable (`gpt-engineer-file-uploads`), e não existe meta tag `og:image`. O Google está exibindo o ícone do Lovable nos resultados de busca.

## Solução

### 1. Copiar o logo existente para `public/`

O arquivo `src/assets/tridots-logo.png` já existe no projeto. Copiar para `public/favicon.png` para uso como favicon e como `og:image`.

### 2. Atualizar `index.html`

| Alteração | Detalhe |
|-----------|---------|
| `<link rel="icon">` | Trocar URL externa do Lovable por `/favicon.png` |
| `<meta property="og:image">` | Adicionar apontando para o logo Tridots (URL absoluta do site publicado) |
| `<meta name="twitter:image">` | Adicionar para compatibilidade com Twitter/X |

### Resultado

- Favicon local usando o logo Tridots Capital
- Meta tags `og:image` para que Google, redes sociais e previews exibam o logo correto
- Google levará alguns dias/semanas para re-indexar e atualizar o ícone nos resultados

### Arquivos alterados

| Arquivo | Operação |
|---------|----------|
| `public/favicon.png` | Cópia de `src/assets/tridots-logo.png` |
| `index.html` | Atualizar favicon + adicionar og:image |

