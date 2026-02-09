

# Plano: Cenarios de Teste para Boleto Unificado (Imobiliaria Demo)

## Resumo

Criar 12 novas analises com `forma_pagamento_preferida = 'boleto_imobiliaria'`, ativar seus contratos e gerar parcelas distribuidas de Jan/2026 a Abr/2026, usando a Imobiliaria Demo (ID: `4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0`).

## Pre-requisito: Configurar billing_due_day

Atualizar a agencia demo para `billing_due_day = 10`.

```sql
UPDATE agencies SET billing_due_day = 10 WHERE id = '4f2ab3ed-6d0f-4a78-a34d-45abe25b22c0';
```

## Dados de Teste: 12 Analises com Boleto Unificado

| # | Inquilino | Aluguel | Cond | IPTU | Total | Plano | Taxa | Garantia Anual | Parcela Mensal | Ativacao | Parcelas a partir de |
|---|-----------|---------|------|------|-------|-------|------|---------------|---------------|----------|---------------------|
| 1 | Renato Barros | 2.000 | 400 | 150 | 2.550 | prime | 12% | 3.672 | 306 | Dez/2025 | Jan/2026 |
| 2 | Sandra Vieira | 3.000 | 600 | 250 | 3.850 | prime | 12% | 5.544 | 462 | Dez/2025 | Jan/2026 |
| 3 | Tiago Melo | 1.500 | 350 | 100 | 1.950 | start | 15% | 3.510 | 292,50 | Dez/2025 | Jan/2026 |
| 4 | Vanessa Cruz | 4.500 | 900 | 400 | 5.800 | exclusive | 10% | 6.960 | 580 | Jan/2026 | Jan/2026 |
| 5 | Wagner Santos | 2.200 | 500 | 180 | 2.880 | prime | 12% | 4.147,20 | 345,60 | Jan/2026 | Fev/2026 |
| 6 | Ximena Lopes | 5.000 | 1.000 | 350 | 6.350 | exclusive | 10% | 7.620 | 635 | Jan/2026 | Fev/2026 |
| 7 | Yuri Campos | 1.800 | 400 | 120 | 2.320 | start | 15% | 4.176 | 348 | Jan/2026 | Fev/2026 |
| 8 | Zilda Ferraz | 3.500 | 700 | 280 | 4.480 | prime | 12% | 6.451,20 | 537,60 | Fev/2026 | Fev/2026 |
| 9 | Andre Moura | 2.800 | 550 | 200 | 3.550 | prime | 12% | 5.112 | 426 | Fev/2026 | Mar/2026 |
| 10 | Beatriz Novaes | 6.000 | 1.200 | 500 | 7.700 | exclusive | 10% | 9.240 | 770 | Fev/2026 | Mar/2026 |
| 11 | Caio Duarte | 1.600 | 350 | 90 | 2.040 | start | 15% | 3.672 | 306 | Mar/2026 | Mar/2026 |
| 12 | Diana Prado | 4.000 | 800 | 350 | 5.150 | prime | 12% | 7.416 | 618 | Mar/2026 | Abr/2026 |

### Distribuicao por mes

| Mes | Contratos com parcelas | Valor estimado |
|-----|----------------------|----------------|
| Jan/2026 | #1, #2, #3, #4 | ~1.640 |
| Fev/2026 | #1-#4 + #5, #6, #7, #8 | ~3.507 |
| Mar/2026 | #1-#8 + #9, #10, #11 | ~5.099 |
| Abr/2026 | #1-#11 + #12 | ~5.717 |

## Implementacao Tecnica

### Passo 1: Migration SQL

Uma unica migration que faz tudo:

1. **Atualiza `billing_due_day`** da agencia demo para 10
2. **Insere 12 analises** com `forma_pagamento_preferida = 'boleto_imobiliaria'`, status `ativo`
3. **Insere 12 contratos** com status `ativo`, `payment_method = 'boleto_imobiliaria'`, `activated_at` conforme a tabela acima
4. **Insere as parcelas** (`guarantee_installments`) para cada contrato - 12 parcelas cada, com `reference_month` e `reference_year` corretos, `due_date` no dia 10 de cada mes, status `pendente`

### Passo 2: Testar no portal

Apos a insercao dos dados:

1. **Portal Tridots** (`/invoices`):
   - Verificar grafico mostrando Jan-Dez/2026
   - Clicar em Jan/2026 - deve mostrar a Imobiliaria Demo na lista
   - Clicar "Gerar Rascunhos" para Jan/2026
   - Ver detalhe da fatura, testar upload de boleto, envio

2. **Portal Agencia** (`/agency` > Faturas):
   - Login com demo@tridots.com.br
   - Verificar grafico com meses preenchidos
   - Clicar nos meses para ver parcelas listadas

### Detalhes da SQL

A migration vai:

- Gerar UUIDs com `gen_random_uuid()`
- Usar CTEs para referenciar IDs criados
- Inserir `imovel_numero` nas analises (campo obrigatorio)
- Definir `inquilino_cpf` unico para cada analise
- Definir `data_fim_contrato` como 12 meses apos ativacao
- Gerar 12 parcelas por contrato com:
  - `installment_number`: 1 a 12
  - `reference_month` e `reference_year`: mes/ano sequencial a partir da ativacao
  - `due_date`: dia 10 do mes de referencia
  - `value`: garantia_anual / 12
  - `status`: pendente

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| Nova migration SQL | Insercao de dados de teste |

Nenhum arquivo de codigo precisa ser alterado - apenas dados no banco.

## Resultado Esperado

- 12 novos contratos ativos com boleto unificado
- 144 parcelas (12 x 12) distribuidas de Jan/2026 a Dez/2026+
- Parcelas vissiveis no grafico de faturas em ambos os portais
- Funcao "Gerar Rascunhos" operacional para consolidar faturas
- Fluxo completo testavel: Rascunho -> Enviar -> Registrar Pagamento

