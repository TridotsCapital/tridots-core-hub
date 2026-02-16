

# Regras de Negocio: Limite R$ 4.000 e Prazo de 60 Dias

## 1. Limite de R$ 4.000 no Valor Locaticio

### Onde sera aplicado
- **Formulario da imobiliaria** (`PropertyStep.tsx`): alerta visual em tempo real + botao de envio desabilitado
- **Banco de dados** (trigger de validacao): ultima camada de seguranca para impedir insercao direta

### Comportamento
Quando a soma de aluguel + condominio + IPTU ultrapassar R$ 4.000:
- Um **banner vermelho** aparece abaixo dos campos de valor, informando: "A Tridots Capital atende apenas locacoes de ate R$ 4.000,00 de valor locaticio mensal."
- O botao **"Enviar Analise"** fica desabilitado e nao permite o envio
- A validacao e reativa: ao digitar os valores, o alerta aparece/desaparece automaticamente

### Arquivos afetados

| # | Arquivo | Mudanca |
|---|---------|---------|
| 1 | `src/components/agency/NewAnalysisSteps/PropertyStep.tsx` | Adicionar calculo reativo do total e exibir Alert vermelho quando > R$ 4.000 |
| 2 | `src/components/agency/NewAnalysisForm.tsx` | Desabilitar botao de submit quando total > R$ 4.000 |
| 3 | Migration SQL | Criar trigger de validacao na tabela `analyses` que rejeita INSERT/UPDATE quando `valor_aluguel + valor_condominio + valor_iptu > 4000` |

---

## 2. Limite de 60 Dias para Itens de Debito (Claims)

### Onde sera aplicado
- **Tabela de debitos** (`ClaimDebtTable.tsx`): bloqueio no calendario + validacao ao selecionar data

### Comportamento
- No calendario de vencimento, **datas anteriores a 60 dias** ficam desabilitadas (nao clicaveis), assim como datas futuras
- Caso um item ja existente tenha vencimento fora do prazo, exibir **erro vermelho** no item com a mensagem: "Nao aceitamos debitos vencidos ha mais de 60 dias"
- O botao de submissao do claim fica desabilitado enquanto houver itens fora do prazo

### Arquivos afetados

| # | Arquivo | Mudanca |
|---|---------|---------|
| 1 | `src/components/agency/claims/ClaimDebtTable.tsx` | Adicionar `disabled` no Calendar para datas < 60 dias atras; validar na selecao e exibir erro se fora do prazo |
| 2 | `src/components/agency/claims/ClaimItemsSection.tsx` | Propagar estado de "tem item invalido" para desabilitar botao de salvar |

---

## Detalhes Tecnicos

### PropertyStep - Alerta de valor locaticio

O componente ja possui os campos `valorAluguel`, `valorCondominio` e `valorIptu`. Sera adicionado um calculo reativo:

```text
const totalLocaticio = valorAluguel + valorCondominio + valorIptu;
const excedeLimite = totalLocaticio > 4000;
```

E um componente `Alert` condicional com variante `destructive` abaixo dos campos financeiros.

O estado `excedeLimite` sera exposto ao componente pai (`NewAnalysisForm`) via `form.watch` para desabilitar o botao de submit.

### Trigger SQL - analyses

```text
CREATE FUNCTION validate_analysis_rental_limit()
  BEFORE INSERT OR UPDATE ON analyses
  IF (valor_aluguel + COALESCE(valor_condominio,0) + COALESCE(valor_iptu,0)) > 4000
    RAISE EXCEPTION 'Valor locaticio total excede o limite de R$ 4.000,00'
```

### ClaimDebtTable - Regra dos 60 dias

A prop `disabled` do Calendar sera atualizada de:
```text
disabled={(date) => isAfter(date, new Date())}
```
Para:
```text
disabled={(date) => {
  const today = startOfDay(new Date());
  const sixtyDaysAgo = subDays(today, 60);
  return isAfter(date, today) || isBefore(date, sixtyDaysAgo);
}}
```

E na funcao `handleDateSelect`, alem de validar datas futuras, validar tambem datas anteriores a 60 dias com mensagem especifica.

