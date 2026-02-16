
# Correcao: "column role does not exist"

## Causa Raiz

Existem **2 triggers** no banco que tentam ler uma coluna `role` da tabela `profiles`, mas essa coluna nao existe — as roles ficam na tabela `user_roles`.

**Triggers com bug:**

1. `notify_agency_new_ticket` (tabela `tickets`) — dispara ao criar ticket
2. `notify_agency_new_ticket_message` (tabela `ticket_messages`) — dispara ao enviar mensagem

Ambos fazem:
```text
SELECT role INTO _user_role
FROM public.profiles
WHERE id = NEW.sender_id
```

Quando deviam consultar `user_roles`.

## Correcao

Uma migration SQL que recria as duas funcoes, trocando a consulta de `profiles.role` para `user_roles.role`:

```text
-- De (errado):
SELECT role INTO _user_role
FROM public.profiles WHERE id = NEW.sender_id;

-- Para (correto):
SELECT role INTO _user_role
FROM public.user_roles WHERE user_id = NEW.sender_id
LIMIT 1;
```

## Arquivos Afetados

| # | Tipo | O que muda |
|---|------|------------|
| 1 | Migration SQL | Recriar funcao `notify_agency_new_ticket` corrigindo a consulta de role |
| 2 | Migration SQL | Recriar funcao `notify_agency_new_ticket_message` corrigindo a consulta de role |

Nenhum arquivo de codigo precisa ser alterado — o bug e 100% no banco de dados.
