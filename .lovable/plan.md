

# Plano: Exclusão em Massa de Contratos (Master Only)

## Objetivo
Adicionar botão de exclusão em massa na barra de ações bulk da lista de contratos (`ContractList`), visível apenas para usuários `master`. Utiliza o `cascade-delete` existente para cada contrato selecionado, com modal de confirmação e progresso.

## Arquivos a criar/modificar

### 1. Criar `src/components/contracts/BulkDeleteContractsModal.tsx`
Modal com 3 etapas:
- **Resumo**: lista os contratos selecionados (nome do inquilino + código), mostra aviso de irreversibilidade
- **Confirmação final**: texto "Tem certeza absoluta?" com contagem total
- **Progresso**: executa `cascade-delete` sequencialmente para cada contrato, exibindo barra de progresso e status (sucesso/erro por contrato). Contratos bloqueados (com claim ativa) serão pulados e listados ao final como "não excluídos"

### 2. Modificar `src/components/contracts/ContractList.tsx`
- Importar `useAuth` e `BulkDeleteContractsModal`
- Na barra de ações bulk (linha ~170), quando `isMaster && selectedIds.length > 0`, exibir botão "Excluir Selecionados" (vermelho, com ícone Trash2)
- Ao clicar, abrir `BulkDeleteContractsModal` passando os IDs e nomes dos contratos selecionados
- Após conclusão, limpar seleção e invalidar queries

### 3. Modificar `src/pages/Contracts.tsx`
- Passar callback `onRefresh` para `ContractList` para forçar recarga após exclusão em massa

## Fluxo do usuário
1. Master seleciona contratos via checkbox (qualquer status)
2. Clica em "Excluir Selecionados" na barra de ações
3. Vê modal com lista dos contratos e aviso de cascata
4. Confirma → sistema executa cascade-delete um a um
5. Barra de progresso mostra andamento
6. Ao final, resumo: X excluídos, Y falhas/bloqueados
7. Lista recarrega automaticamente

## Segurança
- Botão visível apenas quando `isMaster === true` (do `useAuth()`)
- A edge function `cascade-delete` já valida role no servidor
- Sem alteração de schema necessária

## Detalhes técnicos
- Nenhuma migração SQL necessária
- Reutiliza `useCascadeDelete` existente (chamando `executeDeletion('contract', id)` em loop)
- Contratos com claims ativas serão tentados e o erro será capturado e exibido no resumo final (a edge function já retorna erro nesses casos)

