

# Plano: Reformulacao do Step 5 "Geral" no Cadastro de Imobiliaria

## Resumo

Renomear o ultimo step de "Vencimento" para "Geral", expandir o texto explicativo sobre formas de pagamento (PIX/cartao direto com inquilino), e adicionar tres novos campos obrigatorios: total de locacoes ativas (select com faixas), garantias utilizadas (checkboxes com "Outros" e texto livre), e ticket medio dos alugueis (input com mascara de moeda R$).

---

## 1. Renomear Step 5

No array `STEPS` do `AgencySignupForm.tsx`, alterar o titulo do step 5 de `"Vencimento"` para `"Geral"`.

## 2. Expandir Texto Explicativo

Acrescentar ao quadro informativo azul do step 5 a explicacao de que a Tridots Capital tambem oferece pagamento direto com o inquilino via PIX ou cartao de credito, e que a forma de pagamento pode ser escolhida na hora de contratar a garantia para cada inquilino.

## 3. Novo Campo: Total de Locacoes Ativas (obrigatorio)

- Componente: `Select` com as faixas:
  - 0 - 50
  - 51 - 100
  - 101 - 300
  - 301 - 500
  - 501 - 1000
  - 1001 - 2000
  - Acima de 2000
- Validacao: obrigatorio para finalizar o cadastro

## 4. Novo Campo: Garantias Utilizadas (obrigatorio, multi-selecao)

- Componente: Lista de checkboxes com as opcoes:
  - Fiador
  - Cheque caucao
  - Titulo Capitalizacao
  - Seguro Fianca (Seguradoras)
  - Loft
  - CredAluga
  - Facility
  - Loc Pop
  - Outros (ao marcar, exibe input de texto livre)
- O valor de "Outros" sera salvo no mesmo array como `"Outros: texto digitado"`
- Validacao: ao menos uma opcao selecionada

## 5. Novo Campo: Ticket Medio dos Alugueis (obrigatorio)

- Componente: Input numerico com mascara de moeda brasileira (R$ 0.000,00)
- Armazenamento: coluna `ticket_medio_aluguel` do tipo `NUMERIC` na tabela `agencies`
- Validacao: obrigatorio, valor maior que zero

## 6. Banco de Dados - Nova Migracao

Adicionar tres colunas na tabela `agencies`:

```text
total_locacoes_ativas   TEXT       -- faixa selecionada (ex: "51 - 100")
garantias_utilizadas    TEXT[]     -- array (ex: ['Fiador', 'Outros: Nome'])
ticket_medio_aluguel    NUMERIC    -- valor em reais (ex: 2500.00)
```

Todas nullable para compatibilidade com agencias ja existentes.

## 7. Edge Function `register-agency`

Atualizar a interface `AgencyRegistrationData` e o INSERT para incluir os tres novos campos: `total_locacoes_ativas`, `garantias_utilizadas` e `ticket_medio_aluguel`.

## 8. Visibilidade no Painel Tridots (AgencyForm.tsx)

Exibir os tres campos como somente leitura no formulario de detalhes da agencia, para consulta pela equipe Tridots:
- Total de Locacoes Ativas: texto da faixa
- Garantias Utilizadas: lista/badges com as opcoes selecionadas
- Ticket Medio dos Alugueis: valor formatado em R$

---

## Secao Tecnica - Arquivos Afetados

| Arquivo | Mudanca |
|---|---|
| `src/components/auth/AgencySignupForm.tsx` | Renomear step, expandir texto explicativo, adicionar 3 campos com validacao, mascara de moeda |
| `supabase/functions/register-agency/index.ts` | Aceitar e salvar 3 novos campos |
| `src/pages/AgencyForm.tsx` | Exibir 3 campos como somente leitura |
| Nova migracao SQL | Adicionar colunas `total_locacoes_ativas`, `garantias_utilizadas`, `ticket_medio_aluguel` |

## Ordem de Execucao

1. Migracao SQL (novas colunas)
2. Atualizar `AgencySignupForm.tsx` (UI, mascara de moeda, validacao)
3. Atualizar Edge Function `register-agency`
4. Exibir dados no `AgencyForm.tsx`

