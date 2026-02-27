

# Excluir analise — master e analista, qualquer status

## Situacao atual
- A politica de RLS `Masters can delete analyses` so permite exclusao por masters.
- Nao existe nenhum hook `useDeleteAnalysis` nem botao de excluir na UI.
- Tabelas relacionadas (analysis_documents, analysis_timeline, commissions, tickets) possuem foreign keys que podem bloquear o DELETE se nao tratadas.

## Mudancas

### 1. Migrar RLS para incluir analistas
Alterar a politica de DELETE na tabela `analyses` para permitir tanto `master` quanto `analyst`:

```text
DROP POLICY "Masters can delete analyses" ON analyses;
CREATE POLICY "Team members can delete analyses"
  ON analyses FOR DELETE
  TO authenticated
  USING (has_any_role(auth.uid()));
```

Isso permite que qualquer membro da equipe Tridots (master ou analyst) exclua analises.

### 2. Criar hook `useDeleteAnalysis` em `src/hooks/useAnalyses.ts`
Adicionar uma mutation que:
- Exclui documentos relacionados do storage (bucket `analysis-documents`)
- Exclui registros dependentes na ordem correta (analysis_documents, analysis_timeline, commissions vinculadas, tickets vinculados)
- Por fim, exclui a analise em si
- Invalida queries relevantes apos sucesso

### 3. Adicionar botao "Excluir" no AnalysisDrawer
No header do drawer (onde ficam os botoes de acao), adicionar um botao "Excluir Analise" com icone de lixeira, visivel para master e analyst, em qualquer status.

### 4. Dialog de confirmacao
Antes de excluir, exibir um `AlertDialog` com:
- Titulo: "Excluir analise?"
- Descricao: "Esta acao e irreversivel. Todos os documentos, timeline e dados relacionados serao removidos permanentemente."
- Nome do inquilino e ID para conferencia
- Botao vermelho "Excluir definitivamente"

### 5. Opcao no menu de contexto do KanbanCard (opcional)
Adicionar item "Excluir analise" no DropdownMenu do card do kanban, com a mesma confirmacao.

## Arquivos afetados

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Atualizar politica de DELETE para `has_any_role` |
| `src/hooks/useAnalyses.ts` | Adicionar `useDeleteAnalysis` mutation |
| `src/components/kanban/AnalysisDrawer.tsx` | Botao + AlertDialog de exclusao |
| `src/components/kanban/KanbanCard.tsx` | Item "Excluir" no dropdown menu |

## Cuidados
- Limpar registros filhos antes do DELETE principal para evitar violacao de FK
- Limpar arquivos do storage para nao deixar lixo
- Fechar o drawer apos exclusao bem-sucedida
- Registrar no audit_log (opcional, ja que o registro sera apagado)

