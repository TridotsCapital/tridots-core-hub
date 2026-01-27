

# Plano: Reordenação Drag-and-Drop + CRUD de Capítulos e Seções no Help Center Admin

## Visão Geral

Implementar funcionalidades completas de gerenciamento do Help Center no painel Tridots:
1. **Drag-and-drop** para reordenar capítulos e seções
2. **Criar** novos capítulos e seções
3. **Excluir** capítulos e seções existentes
4. Todas as alterações refletirão automaticamente no Help Center da imobiliária

---

## Funcionalidades a Implementar

### 1. Reordenação com Drag-and-Drop

Os capítulos e seções terão ícones de "arrasto" (grip) que permitem reordenar visualmente. Ao soltar, a nova ordem será salva no banco de dados via campo `order_index`.

```text
┌─────────────────────────────────────┐
│ ⠿ 1. Introdução          ✏️       │  ← Arrastar para reordenar
├─────────────────────────────────────┤
│ ⠿ 2. Primeiros Passos    ✏️       │
├─────────────────────────────────────┤
│ ⠿ 3. Dashboard           ✏️       │
└─────────────────────────────────────┘
       [+ Novo Capítulo]
```

### 2. Criar Novos Capítulos/Seções

- Botão "Novo Capítulo" na lista de capítulos
- Botão "Nova Seção" no editor de seções
- Formulário com campos obrigatórios (título, slug, ícone)
- Slug gerado automaticamente a partir do título

### 3. Excluir Capítulos/Seções

- Botão de exclusão com confirmação
- Capítulos só podem ser excluídos se não tiverem seções
- Seções excluídas removem mídia associada

---

## Detalhes Técnicos

### Arquivos a Criar/Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useHelpAdmin.ts` | Adicionar mutations: `useCreateChapter`, `useDeleteChapter`, `useReorderChapters`, `useCreateSection`, `useDeleteSection`, `useReorderSections` |
| `src/components/help-admin/HelpChapterList.tsx` | Adicionar DndContext, SortableContext, botões criar/excluir |
| `src/components/help-admin/HelpSectionEditor.tsx` | Adicionar DndContext, SortableContext, botões criar/excluir |
| `src/components/help-admin/SortableChapterItem.tsx` | Novo componente para item de capítulo arrastável |
| `src/components/help-admin/SortableSectionItem.tsx` | Novo componente para item de seção arrastável |

### Novas Mutations no Hook `useHelpAdmin.ts`

```typescript
// Criar capítulo
useCreateHelpChapter()
// Campos: title, icon, is_new
// Gera slug automaticamente e order_index = max + 1

// Excluir capítulo
useDeleteHelpChapter()
// Verifica se não tem seções antes de deletar

// Reordenar capítulos
useReorderHelpChapters()
// Atualiza order_index de todos os capítulos reordenados

// Criar seção
useCreateHelpSection()
// Campos: chapter_id, title, content
// Gera slug e order_index automaticamente

// Excluir seção  
useDeleteHelpSection()
// Remove seção e mídia associada

// Reordenar seções
useReorderHelpSections()
// Atualiza order_index das seções do capítulo
```

### Lógica de Reordenação

Quando o usuário soltar um item em nova posição:

1. Capturar evento `onDragEnd` do dnd-kit
2. Calcular nova ordem do array
3. Enviar batch update para o banco com novos `order_index`
4. Invalidar queries para refletir mudança

```typescript
// Exemplo de handler
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = items.findIndex(i => i.id === active.id);
  const newIndex = items.findIndex(i => i.id === over.id);
  const reordered = arrayMove(items, oldIndex, newIndex);
  
  // Atualizar order_index de cada item
  reorderMutation.mutate(
    reordered.map((item, idx) => ({ id: item.id, order_index: idx + 1 }))
  );
};
```

### Componente Sortable Item

Cada item de capítulo/seção será envolto em um componente que usa `useSortable`:

```typescript
function SortableChapterItem({ chapter, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: chapter.id,
  });
  
  return (
    <Card ref={setNodeRef} style={{ transform, transition }}>
      <div className="flex items-center">
        {/* Handle de arrasto */}
        <button {...listeners} {...attributes}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        {/* Conteúdo do item */}
        <span>{chapter.title}</span>
        
        {/* Botões de ação */}
        <Button onClick={onEdit}><Edit /></Button>
        <Button onClick={onDelete}><Trash2 /></Button>
      </div>
    </Card>
  );
}
```

### Geração Automática de Slug

```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-")     // Substitui caracteres especiais por hífen
    .replace(/^-|-$/g, "");          // Remove hífens do início/fim
}
```

### Diálogo de Confirmação para Exclusão

```typescript
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir capítulo?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita. O capítulo "{chapter.title}" 
        será removido permanentemente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Fluxo de Implementação

### Fase 1: Backend (Mutations)
1. Adicionar `useCreateHelpChapter` e `useDeleteHelpChapter`
2. Adicionar `useReorderHelpChapters`
3. Adicionar `useCreateHelpSection` e `useDeleteHelpSection`
4. Adicionar `useReorderHelpSections`

### Fase 2: Componentes Sortable
1. Criar `SortableChapterItem.tsx` com useSortable
2. Criar `SortableSectionItem.tsx` com useSortable

### Fase 3: Lista de Capítulos
1. Adicionar DndContext e SortableContext em HelpChapterList
2. Substituir cards por SortableChapterItem
3. Adicionar handler onDragEnd para reordenação
4. Adicionar botão "Novo Capítulo" com diálogo
5. Adicionar botão de exclusão com confirmação

### Fase 4: Editor de Seções
1. Adicionar DndContext e SortableContext em HelpSectionEditor
2. Substituir cards por SortableSectionItem
3. Adicionar handler onDragEnd para reordenação
4. Adicionar botão "Nova Seção" com diálogo
5. Adicionar botão de exclusão com confirmação

---

## Resultado Esperado

Após implementação, a gestão do Help Center terá:

- **Capítulos**: criar, editar título/ícone, reordenar arrastando, excluir
- **Seções**: criar, editar conteúdo, reordenar arrastando, excluir
- **Sincronização**: todas alterações refletem imediatamente no Help Center das imobiliárias
- **UX**: feedback visual durante arrasto, confirmações antes de excluir

O projeto já possui **dnd-kit** instalado e configurado (usado nos Kanbans), então seguiremos o mesmo padrão de implementação já estabelecido.

