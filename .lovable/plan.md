
# Plano Definitivo: Modulo de Faturas com UI Inspirada no Nubank

## Resumo das Definicoes do Usuario

| Aspecto | Definicao |
|---------|-----------|
| **Altura das barras** | Valor total das parcelas do mes (Tridots: soma de todas imobiliarias / Agencia: valor da propria fatura) |
| **Cores das barras** | Verde (paga), Vermelho (atrasada), Amarelo (pendente), Azul claro (futura) |
| **Resumo no topo** | Valor total do mes selecionado + data de vencimento programado |
| **Navegacao ao clicar** | Pagina separada com detalhes da fatura |
| **Estados visuais** | Badges para representar os diferentes status |

---

## Parte 1: Correcoes de Bugs Existentes

### 1.1 Rota Faltando (Portal Tridots)

**Problema**: A rota `/invoices/:invoiceId` nao existe no portal Tridots (linha 78 do App.tsx so tem `/invoices`)

**Correcao**: Adicionar a rota no `InternalRoutes()`:
```text
Arquivo: src/App.tsx
Linha 78: <Route path="/invoices" element={<FinancialInvoices />} />
Adicionar: <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
```

### 1.2 Navegacao Errada

**Problema**: `FinancialInvoices.tsx` navega para `/financial/invoices/:id` que nao existe

| Arquivo | Linha | Atual | Correcao |
|---------|-------|-------|----------|
| `FinancialInvoices.tsx` | 364 | `/financial/invoices/${invoice.id}` | `/invoices/${invoice.id}` |
| `FinancialInvoices.tsx` | 383 | `/financial/invoices/${invoice.id}?tab=payment` | `/invoices/${invoice.id}?tab=payment` |
| `InvoiceDetail.tsx` | 74 | `/financial/invoices` | `/invoices` |

### 1.3 Bug do Vencimento das Parcelas

**Analise**: Verifiquei os dados no banco e a logica da Edge Function `generate-installments`. O comportamento esta CORRETO conforme a regra de negocio documentada:

| Parcela | Data Gerada | Dia Configurado | Situacao |
|---------|-------------|-----------------|----------|
| 4 (Mai/2026) | 2026-05-11 | 10 | 10/05 e Domingo, postergou para 11 |
| 9 (Out/2026) | 2026-10-12 | 10 | 10/10 e Sabado, postergou para 12 |
| 12 (Jan/2027) | 2027-01-11 | 10 | 10/01 e Domingo, postergou para 11 |

Isso segue a regra: "Vencimentos em finais de semana sao automaticamente postergados para o proximo dia util."

**Se o usuario desejar manter sempre o dia fixo (ignorando fins de semana)**, sera necessario remover a funcao `adjustToBusinessDay` da Edge Function. Aguardando confirmacao.

---

## Parte 2: Nova Interface Inspirada no Nubank

### 2.1 Novo Componente: Grafico de Barras Mensal

Criar componente reutilizavel `MonthlyInvoiceChart.tsx`:

```text
+------------------------------------------------------------------+
|  [<]  Nov  Dez  Jan  Fev  Mar  Abr  Mai  Jun  Jul  Ago  Set  [>] |
|        |    |    |    █    |    |    |    |    |    |    |       |
|        |    |    |   ███   |    |    |    |    |    |    |       |
|        |    |    |   ███  ███  ███  ███  ███  ███  ███  ███      |
|  (verde)   (amarelo)  (azul claro para futuras)                  |
+------------------------------------------------------------------+
```

**Estrutura**:
- Barra horizontal com 12 meses visiveis
- Setas para navegar entre periodos
- Barra selecionada destacada visualmente
- Altura proporcional ao valor do mes
- Cores por status predominante do mes

**Cores Definidas**:
- `bg-green-500` - Paga
- `bg-red-500` - Atrasada
- `bg-yellow-500` - Pendente (aguardando pagamento)
- `bg-blue-200` - Futura (parcelas agendadas)

### 2.2 Nova Estrutura: Portal Tridots (`FinancialInvoices.tsx`)

```text
+------------------------------------------------------------------+
| FATURAS UNIFICADAS                            [Gerar Rascunhos]  |
| Gestao de faturas de garantia por imobiliaria                    |
+------------------------------------------------------------------+
| GRAFICO DE BARRAS MENSAL (componente MonthlyInvoiceChart)        |
| [<]  Nov  Dez  Jan  [FEV]  Mar  Abr  Mai  Jun  Jul  Ago  Set [>] |
+------------------------------------------------------------------+
| CARD RESUMO DO MES SELECIONADO                                   |
| +--------------------------+                                     |
| | Fevereiro 2026           |                                     |
| | R$ 100,00                |                                     |
| | Vencimento: 10/02/2026   |                                     |
| | 1 imobiliaria            |                                     |
| +--------------------------+                                     |
+------------------------------------------------------------------+
| LISTA DE IMOBILIARIAS COM FATURA NO MES SELECIONADO              |
| +--------------------------------------------------------------+ |
| | teste 15 LTDA                                                | |
| | CNPJ: xx.xxx.xxx/0001-xx                                     | |
| | R$ 100,00           [Rascunho]               [Ver Detalhes]  | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Comportamento**:
1. Usuario clica em um mes no grafico
2. Card de resumo atualiza com totais do mes
3. Lista abaixo mostra todas as imobiliarias com fatura/parcelas naquele mes
4. Clicar em "Ver Detalhes" navega para `/invoices/:id`

### 2.3 Nova Estrutura: Portal Agencia (`AgencyInvoices.tsx`)

```text
+------------------------------------------------------------------+
| MINHAS FATURAS                                                   |
| Acompanhe suas faturas de garantia                               |
+------------------------------------------------------------------+
| [Alerta se houver fatura atrasada]                               |
+------------------------------------------------------------------+
| GRAFICO DE BARRAS MENSAL (componente MonthlyInvoiceChart)        |
| [<]  Nov  Dez  Jan  [FEV]  Mar  Abr  Mai  Jun  Jul  Ago  Set [>] |
+------------------------------------------------------------------+
| CARD RESUMO DO MES SELECIONADO                                   |
| +--------------------------+                                     |
| | Fevereiro 2026           |                                     |
| | R$ 100,00                |                                     |
| | Vencimento: 10/02/2026   |                                     |
| | Status: Rascunho         |                                     |
| +--------------------------+                                     |
+------------------------------------------------------------------+
| DETALHES DOS CONTRATOS DA FATURA                                 |
| +--------------------------------------------------------------+ |
| | Contrato | Inquilino | Imovel      | Parcela | Valor | Acao | |
| |----------|-----------|-------------|---------|-------|------| |
| | c3e5...  | Joao Silva| Rua X, 123  | 1/12    | R$100 | [>]  | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Comportamento**:
1. Usuario clica em um mes no grafico
2. Card de resumo mostra valor + vencimento + status
3. Tabela abaixo detalha cada contrato/parcela da fatura
4. Botao de acao permite navegar para o contrato

---

## Parte 3: Novo Hook para Dados Consolidados

### 3.1 Hook `useMonthlyInvoiceSummary`

Buscar dados consolidados por mes (faturas existentes + parcelas futuras):

```typescript
interface MonthSummary {
  month: number;
  year: number;
  totalValue: number;
  status: 'paga' | 'atrasada' | 'pendente' | 'futura';
  invoiceCount: number;    // Para Tridots
  hasInvoice: boolean;     // Se ja tem fatura gerada
}

export const useMonthlyInvoiceSummary = (agencyId?: string) => {
  // Query 1: Faturas existentes (agency_invoices)
  // Query 2: Parcelas futuras sem fatura (guarantee_installments onde status = 'pendente')
  // Consolidar ambos os datasets por mes/ano
};
```

### 3.2 Hook `useAgenciesWithInvoiceInMonth`

Para o portal Tridots, listar imobiliarias com fatura em um mes especifico:

```typescript
interface AgencyInvoiceSummary {
  agencyId: string;
  agencyName: string;
  cnpj: string;
  invoiceId: string | null;   // null se for apenas parcelas futuras
  totalValue: number;
  dueDate: string;
  status: 'paga' | 'atrasada' | 'pendente' | 'futura' | 'rascunho';
}

export const useAgenciesWithInvoiceInMonth = (month: number, year: number) => {
  // Query com JOIN entre agency_invoices, guarantee_installments e agencies
};
```

---

## Parte 4: Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/App.tsx` | Modificar | Adicionar rota `/invoices/:invoiceId` |
| `src/components/invoices/MonthlyInvoiceChart.tsx` | **Criar** | Componente do grafico de barras mensal |
| `src/hooks/useMonthlyInvoiceSummary.ts` | **Criar** | Hook para dados consolidados por mes |
| `src/pages/FinancialInvoices.tsx` | Modificar | Refatorar com novo layout (grafico + lista) |
| `src/pages/agency/AgencyInvoices.tsx` | Modificar | Refatorar com novo layout (grafico + detalhes) |
| `src/pages/InvoiceDetail.tsx` | Modificar | Corrigir botao voltar |

---

## Parte 5: Comportamento Detalhado do Grafico

### 5.1 Calculo da Altura das Barras

```typescript
// Encontrar o maior valor para escala
const maxValue = Math.max(...months.map(m => m.totalValue));

// Altura proporcional (minimo 20% para visualizacao)
const getBarHeight = (value: number) => {
  if (value === 0) return 4; // altura minima
  return Math.max(20, (value / maxValue) * 100);
};
```

### 5.2 Determinacao da Cor

```typescript
const getBarColor = (month: MonthSummary) => {
  if (!month.hasInvoice) return 'bg-blue-200';  // Futura
  switch (month.status) {
    case 'paga': return 'bg-green-500';
    case 'atrasada': return 'bg-red-500';
    case 'pendente': 
    case 'rascunho':
    case 'gerada':
    case 'enviada':
      return 'bg-yellow-500';
    default: return 'bg-blue-200';
  }
};
```

### 5.3 Navegacao entre Periodos

- Seta esquerda: move 3 meses para tras
- Seta direita: move 3 meses para frente
- Limite: 12 meses no passado ate 12 meses no futuro
- Mes atual centralizado no carregamento inicial

---

## Parte 6: Acoes na Pagina de Detalhe

Quando usuario clica em uma imobiliaria (Tridots) ou ve detalhes (Agencia):

### Portal Tridots - Detalhes da Fatura (`/invoices/:id`)
- Resumo: Status, Vencimento, Valor Total, Valor Pago
- Tabela de parcelas vinculadas
- **Acoes**:
  - "Ir para Contrato" - navega para `/contracts/:id`
  - "Upload Boleto" - permite anexar PDF do boleto
  - "Registrar Pagamento" - modal existente
  - "Enviar Fatura" - muda status para 'enviada'
  - "Cancelar Fatura" - cria nova e cancela atual

### Portal Agencia - Detalhes da Fatura (`/invoices/:id`)
- Resumo: Status, Vencimento, Valor Total
- Tabela de parcelas com link para contrato
- Download de boleto (quando disponivel)
- Historico de eventos

---

## Parte 7: Tratamento de Meses Futuros

Para meses onde ainda nao existe fatura (apenas parcelas pendentes):

### No Grafico
- Barra azul claro
- Ao clicar, mostra card com:
  - "Fatura ainda nao gerada"
  - Valor previsto (soma das parcelas)
  - Data de vencimento prevista

### Na Lista (Tridots)
- Mostra imobiliarias com parcelas agendadas
- Botao "Gerar Fatura" ao lado (chama `generate-invoice-drafts`)

### Na Tabela (Agencia)
- Mostra parcelas agendadas com status "Aguardando Faturamento"
- Sem acoes (read-only)

---

## Resumo de Implementacao

### Ordem de Execucao

1. **Correcoes imediatas**: Adicionar rota, corrigir navegacoes
2. **Criar hook** `useMonthlyInvoiceSummary` 
3. **Criar componente** `MonthlyInvoiceChart`
4. **Refatorar** `FinancialInvoices.tsx` com novo layout
5. **Refatorar** `AgencyInvoices.tsx` com novo layout
6. **Criar hook** `useAgenciesWithInvoiceInMonth`
7. **Testar** fluxo completo em ambos os portais

### Resultado Esperado

1. Erro 404 ao clicar em fatura corrigido
2. Grafico de barras visual com meses (estilo Nubank)
3. Navegacao intuitiva entre meses passados, atual e futuros
4. Cores claras indicando status de cada mes
5. Lista de imobiliarias (Tridots) ou contratos (Agencia) abaixo
6. Acoes funcionais para gerenciar faturas
