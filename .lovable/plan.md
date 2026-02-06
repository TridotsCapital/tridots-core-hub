

# Plano Completo: Sistema de Faturamento Unificado (Boleto Imobiliaria)

## Resumo Executivo

Este documento consolida TODAS as regras de negocio coletadas para implementacao do modulo "Boleto Unificado", que permite as imobiliarias pagarem a garantia de multiplos contratos em uma unica fatura mensal.

---

## Regras de Negocio Consolidadas

### 1. Configuracao da Imobiliaria

| Regra | Definicao |
|-------|-----------|
| Data de vencimento | Opcoes fixas: dia 05, 10 ou 15 do mes |
| Quando definir | **Obrigatorio no cadastro** da imobiliaria (novo step) |
| Alteracao da data | Solicitada via perfil, validada pela Tridots |
| Vigencia da alteracao | **Proximo mes** (fatura atual mantem data antiga) |
| Imobiliaria nova | **Liberado desde o inicio** (sem restricoes) |

### 2. Regra de Corte para Primeira Parcela

```text
Exemplo: Vencimento configurado = Dia 10

Contrato ativado entre dia 01-09  -> 1a parcela no dia 10 do MESMO mes
Contrato ativado entre dia 10-31  -> 1a parcela no dia 10 do PROXIMO mes
```

**Pro-rata**: Nao existe. Sempre parcela cheia.

### 3. Ciclo de Vida da Fatura

**Status disponiveis (5):**
```text
RASCUNHO -> GERADA -> ENVIADA -> ATRASADA -> PAGA
                  \-> CANCELADA (gera nova fatura)
```

**Datas especiais:**
- Vencimento em sabado/domingo/feriado: **Posterga para proximo dia util**
- Fatura zerada (sem contratos): **Gera registro com R$ 0,00**

### 4. Fluxo de Geracao de Faturas

```text
1. Sistema gera RASCUNHO automatico (lista parcelas pendentes)
2. Analista Tridots revisa os valores
3. Analista pode EDITAR valores (adicionar taxas/ajustes)
4. Analista faz UPLOAD do PDF do boleto (gerado externamente)
5. Analista clica "Enviar Fatura"
6. Status muda para ENVIADA
7. E-mail automatico para imobiliaria
```

### 5. Baixa de Pagamento

| Regra | Definicao |
|-------|-----------|
| Informacoes registradas | Data pagamento + Comprovante PDF + Observacoes |
| Baixa parcial | **NAO permitido** (apenas valor exato) |
| Efeito da baixa | Marca todas as parcelas vinculadas como PAGAS |
| Cancelamento | Gera nova fatura corrigida |

### 6. Sistema de Inadimplencia e Bloqueio

**Timeline de cobranca:**
```text
Dia 0      -> Fatura vence
Dia +1     -> E-mail de cobranca automatico
Dia +24h   -> E-mail alerta "48h para bloqueio"
Dia +72h   -> BLOQUEIO AUTOMATICO + E-mail de confirmacao
```

**Funcoes bloqueadas (Hard Lock):**
- Criar novas analises
- Abrir acionamentos de garantia
- Renovar contratos
- *Obs: Pode visualizar dados, abrir tickets de suporte*

**Desbloqueio:**
- Manual pela Tridots apos confirmar pagamento e dar baixa

**Visual no portal imobiliaria:**
- Banner VERMELHO urgente com link para fatura

### 7. Fluxo de Aprovacao e Aceite

**No modal de aprovacao (Tridots):**
- Campo de link de pagamento **DESABILITADO**
- Texto: "Pagamento via Boleto Unificado"

**Link de aceite do inquilino:**
- Step 1: Assinatura do termo
- Step 2: Pagamento do Setup (se aplicavel)
- *Obs: Nao aparece pagamento da garantia*

**Ativacao do contrato:**
- Se tem Setup: Apos validar pagamento do Setup
- Se Setup isento: Apos aceite assinado

### 8. Calculo das 12 Parcelas

```text
Base: Data de ativacao do contrato
Regra: Aplica regra de corte para definir 1a parcela
Demais: 11 parcelas subsequentes, mesmo dia do mes
Valor: garantia_anual / 12 (sem pro-rata)
```

### 9. Contratos e Cancelamentos

| Cenario | Comportamento |
|---------|---------------|
| Contrato cancelado | Cobra parcela do mes atual, remove das proximas faturas |
| Mudanca de forma pagamento | **Impossivel** durante vigencia |
| Na renovacao | Pode escolher nova forma de pagamento |
| Renovacao Boleto -> Cartao | Exige aprovacao Tridots + novo link aceite inquilino |

### 10. Comissionamento

- Mesma regra atual: comissao gerada no **mes seguinte ao pagamento**
- Gatilho: baixa da fatura unificada gera comissoes de todas as parcelas

### 11. Notificacoes por E-mail

| Evento | Destinatario |
|--------|-------------|
| Boleto gerado e disponivel | Imobiliaria |
| Lembrete 3 dias pre-vencimento | Imobiliaria |
| Cobranca 1o dia de atraso | Imobiliaria |
| Alerta 48h antes bloqueio | Imobiliaria |
| Confirmacao de bloqueio | Imobiliaria |

### 12. Segunda Via do Boleto

- **Via ticket de suporte** (imobiliaria solicita, Tridots envia)

---

## Interfaces e Navegacao

### Portal Tridots - Modulo Faturas

**Tela principal: Lista unificada com filtros**
- Filtros: Imobiliaria, Status, Mes/Ano, Vencimento
- Colunas: Imobiliaria, Ref (MM/AAAA), Valor, Vencimento, Status, Acoes
- Acoes: Ver detalhes, Baixar boleto, Registrar pagamento

**Tela de detalhe (Espelho da Fatura):**
- Header: Imobiliaria, Periodo, Total, Status, Vencimento
- Resumo totalizador no topo
- Tabela de itens com:
  - Dados do contrato/inquilino (nome, endereco, valor parcela, n/12)
  - Link para abrir contrato
  - Status da parcela (paga/pendente)
- Acoes: Upload boleto, Enviar, Dar baixa, Cancelar

**Historico da fatura:**
- Timeline de eventos (criada, enviada, paga, cancelada)
- Usuario responsavel por cada acao
- Anexos/comprovantes
- Notas internas

**Dashboard KPIs:**
- Total a receber, Total recebido, Total atrasado
- Contador de imobiliarias bloqueadas
- Alertas de faturas vencendo em 5 dias
- Grafico de evolucao mensal

### Portal Imobiliaria - Modulo Faturas

**Menu lateral:** Novo item "Faturas" com badge de pendentes

**Listagem de faturas:**
- Historico completo com mesmo nivel de detalhamento
- Filtros por status e periodo

**Detalhe da fatura:**
- Espelho igual ao Tridots (sem acoes administrativas)
- Download do boleto PDF
- Exportar fatura em PDF

### Contratos - Novas Exibicoes

**Listagem de contratos:**
- Badge colorido indicando forma de pagamento
- Filtro por forma de pagamento

**Detalhe do contrato (nova aba "Parcelas"):**
- Timeline visual vertical com 12 meses
- Cada linha: mes, status (paga/pendente), valor, data vencimento
- Cores diferenciadas por status

---

## Exportacoes

| Tipo | Formato | Disponivel em |
|------|---------|---------------|
| Espelho individual | PDF com logo Tridots | Tridots + Imobiliaria |
| Lista de faturas | Excel/CSV | Tridots |
| Relatorio consolidado | PDF | Tridots |

---

## Estrutura de Dados

### Novas Tabelas

```text
agencies (modificacao)
  + billing_due_day: smallint (5, 10, ou 15)
  + billing_status: enum (em_dia, atrasada, bloqueada)
  + billing_blocked_at: timestamptz

agency_invoices
  - id: uuid
  - agency_id: uuid (FK agencies)
  - reference_month: smallint
  - reference_year: smallint
  - status: enum (rascunho, gerada, enviada, atrasada, paga, cancelada)
  - total_value: numeric
  - adjusted_value: numeric (permite edicoes manuais)
  - due_date: date
  - boleto_url: text (storage path)
  - boleto_barcode: text
  - paid_at: timestamptz
  - paid_value: numeric
  - payment_proof_url: text
  - payment_notes: text
  - paid_by: uuid (FK auth.users)
  - sent_at: timestamptz
  - sent_by: uuid
  - canceled_at: timestamptz
  - canceled_by: uuid
  - replacement_invoice_id: uuid (FK self)
  - created_at: timestamptz
  - created_by: uuid

invoice_items
  - id: uuid
  - invoice_id: uuid (FK agency_invoices)
  - installment_id: uuid (FK guarantee_installments)
  - contract_id: uuid (FK contracts)
  - tenant_name: text
  - property_address: text
  - installment_number: smallint
  - value: numeric
  - created_at: timestamptz

guarantee_installments
  - id: uuid
  - contract_id: uuid (FK contracts)
  - agency_id: uuid (FK agencies)
  - installment_number: smallint (1-12)
  - reference_month: smallint
  - reference_year: smallint
  - value: numeric
  - status: enum (pendente, faturada, paga, cancelada)
  - due_date: date
  - invoice_item_id: uuid (FK invoice_items)
  - paid_at: timestamptz
  - created_at: timestamptz

invoice_timeline
  - id: uuid
  - invoice_id: uuid (FK agency_invoices)
  - event_type: enum (created, sent, payment_registered, canceled, note_added)
  - description: text
  - user_id: uuid
  - attachment_url: text
  - created_at: timestamptz

analyses (modificacao)
  + forma_pagamento_preferida: adicionar valor 'boleto_imobiliaria'

contracts (modificacao)
  + payment_method: enum (pix, card, boleto_imobiliaria)
```

### Edge Functions

| Funcao | Trigger | Descricao |
|--------|---------|-----------|
| generate-installments | Ativacao contrato | Cria 12 parcelas aplicando regra de corte |
| generate-invoice-drafts | pg_cron (dia 1) | Gera rascunhos de faturas para o mes |
| check-invoice-delinquency | pg_cron (diario) | Atualiza status atrasada e aplica bloqueio 72h |
| send-invoice-notifications | Trigger | Envia e-mails de fatura |
| process-invoice-payment | Manual | Baixa fatura e marca parcelas como pagas |

---

## Sequencia de Implementacao

### Fase 1: Fundacao (Backend)
1.1 Criar tabelas e enums
1.2 Modificar agencies para billing_due_day
1.3 Modificar analyses para boleto_imobiliaria
1.4 Edge Function: generate-installments
1.5 Edge Function: generate-invoice-drafts

### Fase 2: Painel Admin Tridots
2.1 Pagina de listagem de faturas
2.2 Pagina de detalhe/espelho da fatura
2.3 Modal de baixa de pagamento
2.4 Timeline e historico da fatura
2.5 Dashboard KPIs de faturamento

### Fase 3: Portal Imobiliaria
3.1 Desbloquear opcao no formulario de analise
3.2 Novo step no cadastro (data vencimento)
3.3 Menu "Faturas" com listagem e detalhes
3.4 Sistema de bloqueio e banners
3.5 Aba "Parcelas" no contrato

### Fase 4: Automacoes e Notificacoes
4.1 E-mails de cobranca e alertas
4.2 pg_cron para inadimplencia automatica
4.3 Exportacoes PDF/Excel
4.4 Fluxo de renovacao com mudanca de forma pagamento

