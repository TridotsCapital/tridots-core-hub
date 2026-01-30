
# Plano de Correção: Upload de Templates com Caracteres Especiais

## Problema Identificado

O sistema não consegue fazer upload de arquivos cujos nomes contêm:
- Espaços
- Caracteres acentuados (á, é, ã, ç, etc.)
- Outros caracteres especiais

Isso ocorre porque o caminho do arquivo no Storage é gerado diretamente a partir do nome original do arquivo, que o Supabase Storage rejeita.

## Solução

Vou criar uma função que "sanitiza" o nome do arquivo, removendo ou substituindo caracteres problemáticos antes de enviar para o Storage. O nome original do arquivo será preservado no banco de dados para exibição.

### Modificações Necessárias

**1. Atualizar `src/hooks/useTermTemplates.ts`**

Adicionar uma função utilitária para sanitizar nomes de arquivos:

```typescript
// Remove acentos e caracteres especiais, substitui espaços por underscores
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize("NFD")                    // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, "")    // Remove marcas diacríticas
    .replace(/[^a-zA-Z0-9._-]/g, "_")   // Substitui caracteres especiais por _
    .replace(/_+/g, "_");               // Remove underscores duplicados
};
```

Aplicar essa função em dois lugares:
- `useUploadTermTemplate` (linha 72)
- `useUploadNewVersion` (linha 130)

**2. Fazer upload do novo arquivo**

Após a correção, vou fazer upload do arquivo PDF que você enviou como nova versão do template `termo_adesao_imobiliaria`.

---

### Detalhes Técnicos

| Local | Antes | Depois |
|-------|-------|--------|
| `useUploadTermTemplate` (linha 72) | `` `${Date.now()}_${file.name}` `` | `` `${Date.now()}_${sanitizeFileName(file.name)}` `` |
| `useUploadNewVersion` (linha 130) | `` `${Date.now()}_${file.name}` `` | `` `${Date.now()}_${sanitizeFileName(file.name)}` `` |

O nome original (`file.name`) continuará sendo salvo no campo `file_name` da tabela para exibição correta ao usuário.

---

### Sobre o Arquivo Enviado

Após a correção, farei o upload do PDF que você anexou como **versão 5** do template `termo_adesao_imobiliaria`, substituindo a versão atual.
