
Objetivo: corrigir de forma definitiva a exclusão em massa/cascata para não sobrar contratos parcialmente excluídos nem análises “Ativas” órfãs.

Diagnóstico já confirmado (não é chute):
1) O erro `non-2xx` vem de FK: `claims_contract_id_fkey` (contrato ainda referenciado por `claims`).
2) A causa raiz é a exclusão de claim falhar silenciosamente quando há ticket com `tickets.claim_id` preenchido (a função hoje preserva ticket, mas não remove o vínculo FK).
3) Há outra regra incompleta: `invoice_items` ligados por `contract_id` (sem `guarantee_installments.invoice_item_id`) não entram no cleanup atual e também bloqueiam exclusão em alguns contratos.
4) Existem análises órfãs legadas (status `aprovada`, exibido como “Ativa”) porque houve exclusões parciais anteriores.

Plano de correção (varredura completa):
1) Endurecer a função de cascata (`cascade-delete`) para nunca “falhar em silêncio”
- Validar `error` em toda operação `delete/update/storage`.
- Interromper com erro explícito por etapa (claim/parcelas/faturas/contrato/análise), incluindo IDs no retorno.
- Remover o comportamento de “sucesso parcial sem aviso” quando a análise não for apagada.

2) Corrigir preservação de tickets sem quebrar FK
- Ao preservar ticket, além de gravar `deleted_link_info`, também limpar a coluna de vínculo correspondente (`claim_id`, `contract_id`, `analysis_id`) antes de apagar entidade pai.
- Aplicar isso no fluxo de contrato, claim e análise.

3) Cobrir todos os vínculos de fatura/itens na exclusão de contrato
- Deletar `invoice_items` por duas rotas:
  a) itens vindos de `guarantee_installments.invoice_item_id`
  b) itens ligados diretamente por `invoice_items.contract_id`
- Recalcular faturas remanescentes e excluir fatura vazia (como já previsto), agora com conjunto completo de itens.

4) Blindagem de schema para evitar recorrência
- Migração de FK de `tickets.claim_id` para `ON DELETE SET NULL` (mantém ticket preservado e impede bloqueio futuro por FK).
- Sem alterar regra de negócio de preservação de chamados.

5) Correção retroativa dos dados já quebrados
- Rodar rotina de saneamento para análises órfãs exibidas como “Ativas” (sem contrato), removendo dependências e a análise de forma consistente com a regra atual.
- Reprocessar os contratos que ficaram pendentes por falha anterior (incluindo os da Demo), agora com a cascata corrigida.

6) Melhorar feedback no portal TRIDOTS
- No modal de exclusão em massa, mostrar erro real por contrato (ex.: “claim vinculada por ticket”, “invoice_items diretos”), em vez de só “non-2xx”.
- Manter resumo final com sucessos/falhas detalhados.

Validação final (obrigatória):
- Testar novamente exclusão em massa no portal TRIDOTS (incluindo os contratos que falharam).
- Confirmar:
  1) contratos removidos;
  2) claims vinculadas removidas;
  3) tickets preservados com `deleted_link_info` e vínculos nulos;
  4) nenhuma análise `aprovada/ativo` sem contrato;
  5) sem retorno `non-2xx` para o mesmo cenário.
