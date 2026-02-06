

# Plano de Correção: Módulo de Faturas

## Problemas Identificados

### 1. Gráfico muito apertado
O componente `MonthlyInvoiceChart.tsx` está com altura fixa de apenas 32px para as barras (`h-32`) e espaçamento muito pequeno entre os elementos.

### 2. Não está listando imobiliárias para Tridots
Ao verificar o hook `useAgenciesWithInvoiceInMonth`, ele está funcionando corretamente, mas pode haver um problema de dados vazios ou filtros incorretos. Preciso verificar se a query está retornando dados.

### 3. Erro 404 ao clicar em "Ver Contrato" nas faturas da agência
**Causa raiz identificada:**
- O botão navega para `/contracts/:contract_id`
- Porém, o componente `AgencyContractDetail` busca análises usando o ID da URL como `analysis_id` (linha 112)
- Os IDs são diferentes: `contract_id` ≠ `analysis_id`

**Comprovação no banco:**
```text
contract_id:  c3e5c4f8-c40d-4e97-9fa2-5e20da617c24
analysis_id:  6044b4ff-d054-4361-8b2b-8b3ad8abee0d
```

---

## Correções Planejadas

### 1. Melhorar Visual do Gráfico (`MonthlyInvoiceChart.tsx`)

| Aspecto | Atual | Novo |
|---------|-------|------|
| Altura do container | `h-32` (8rem) | `h-40` (10rem) |
| Largura das barras | `w-8 sm:w-10` | `w-10 sm:w-12` |
| Gap entre elementos | `gap-1 sm:gap-2` | `gap-2 sm:gap-3` |
| Padding do card | `p-4` | `p-6` |
| Tamanho da fonte | `text-[10px]` | `text-xs` |

### 2. Corrigir Navegação "Ver Contrato" (`useMonthlyInvoiceSummary.ts`)

O hook precisa retornar o `analysis_id` junto com o `contract_id` para que a navegação funcione corretamente.

**Alteração na query de invoice_items:**
```typescript
// Atual
contract_id,
tenant_name,
property_address,
installment_number,
value,

// Novo - adicionar join para pegar analysis_id
contract_id,
tenant_name,
property_address,
installment_number,
value,
contracts!inner (analysis_id)
```

**Alteração na função handleGoToContract (`AgencyInvoices.tsx`):**
```typescript
// Atual
const handleGoToContract = (contractId: string) => {
  navigate(agencyPath(`/contracts/${contractId}`));
};

// Novo - usar analysis_id em vez de contract_id
const handleGoToContract = (analysisId: string) => {
  navigate(agencyPath(`/contracts/${analysisId}`));
};
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/invoices/MonthlyInvoiceChart.tsx` | Aumentar altura e espaçamento do gráfico |
| `src/hooks/useMonthlyInvoiceSummary.ts` | Incluir `analysis_id` na query de `useAgencyMonthInstallments` |
| `src/pages/agency/AgencyInvoices.tsx` | Usar `analysis_id` na navegação para contrato |

---

## Detalhes Técnicos

### Correção do Hook `useAgencyMonthInstallments`

Na parte que busca parcelas pendentes (sem fatura), modificar a query para incluir o `analysis_id`:

```typescript
// Linha 315-336 - Query de guarantee_installments
const { data: installments, error } = await supabase
  .from('guarantee_installments')
  .select(`
    id,
    installment_number,
    value,
    due_date,
    status,
    contract_id,
    contracts!inner (
      agency_id,
      analysis_id,  // <-- ADICIONAR
      analyses!inner (
        inquilino_nome,
        imovel_endereco,
        imovel_numero
      )
    )
  `)
```

E atualizar o retorno para incluir `analysis_id`:

```typescript
return (installments || []).map((inst: any) => ({
  id: inst.id,
  contract_id: inst.contract_id,
  analysis_id: inst.contracts?.analysis_id,  // <-- ADICIONAR
  tenant_name: inst.contracts?.analyses?.inquilino_nome || 'N/A',
  property_address: `...`,
  installment_number: inst.installment_number,
  value: inst.value,
  invoiceStatus: 'futura',
  hasInvoice: false
}));
```

### Correção da Navegação em `AgencyInvoices.tsx`

```typescript
// Linha 70-72 - Alterar para usar analysis_id
const handleGoToContract = (analysisId: string) => {
  navigate(agencyPath(`/contracts/${analysisId}`));
};

// Linha 195 - Alterar chamada
onClick={() => handleGoToContract(item.analysis_id)}
```

### Melhoria Visual do Gráfico

```typescript
// Container principal
<div className="bg-card rounded-lg border p-6">

// Container das barras - aumentar altura
<div className="flex items-end justify-center gap-2 sm:gap-3 flex-1 h-40 overflow-hidden">

// Cada barra - aumentar largura
<button className="flex flex-col items-center gap-1.5 ... min-w-[48px] sm:min-w-[56px]">

// Barra visual - aumentar largura
<div className="w-10 sm:w-12 rounded-t ...">

// Texto do mês - aumentar tamanho
<span className="text-xs font-medium ...">
```

---

## Resultado Esperado

1. Gráfico de barras mais espaçoso e visualmente agradável
2. Listagem de imobiliárias aparecendo corretamente para cada mês
3. Clique em "Ver Contrato" navegando corretamente para a página de detalhes do contrato

