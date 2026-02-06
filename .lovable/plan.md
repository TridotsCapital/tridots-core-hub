

# Plano: Ajustes no Modulo de Faturas

## Resumo das Solicitacoes

| Ponto | Solicitacao | Acao |
|-------|-------------|------|
| 1 | Mostrar 12 meses (Jan-Dez) | Alterar `MONTHS_VISIBLE` de 7 para 12 |
| 2 | Mes selecionado inicial = mes vigente | Inicializar estado com mes atual |
| 3 | Contagem a partir de Jan/2026 | Alterar logica de geracao de meses |
| 4 | Explicar funcao "Gerar Rascunhos" | Resposta abaixo |
| 5 | Pagina de detalhe da fatura limitada | Adicionar acoes de upload de boleto e baixa |

---

## Ponto 4: Explicacao da Funcao "Gerar Rascunhos"

A funcao "Gerar Rascunhos" existe por uma razao operacional importante:

**Contexto:**
- As parcelas de garantia (`guarantee_installments`) sao criadas automaticamente quando um contrato e ativado
- Porem, a **fatura consolidada** (que agrupa todas as parcelas de uma imobiliaria em um unico boleto) nao existe automaticamente

**O que a funcao faz:**
1. Busca todas as agencias que usam boleto unificado (`billing_due_day` configurado)
2. Para cada agencia, busca parcelas pendentes do mes/ano selecionado
3. Cria uma fatura no status "Rascunho" agrupando todas as parcelas
4. Vincula cada parcela a um item da fatura
5. Registra o evento na timeline da fatura

**Por que e importante:**
- Permite que a Tridots revise as faturas ANTES de envia-las
- Possibilita ajustes manuais (desconto, correcoes)
- O fluxo e: Rascunho -> Gerada (com PDF/boleto) -> Enviada -> Paga

**Em producao:**
- Um job automatico (pg_cron) executa essa funcao no dia 1 de cada mes
- O botao manual serve para: testes, geracao sob demanda, ou correcao de erros

---

## Parte 1: Mostrar 12 Meses no Grafico

### Arquivo: `src/components/invoices/MonthlyInvoiceChart.tsx`

**Alteracao 1 - Linha 22:**
```typescript
// ATUAL
const MONTHS_VISIBLE = 7;

// NOVO
const MONTHS_VISIBLE = 12;
```

**Alteracao 2 - Layout do container (linha 211):**
Ajustar o layout para acomodar 12 barras sem ficar apertado:
```typescript
// ATUAL
<div className="flex items-end justify-center gap-2 sm:gap-4 flex-1 h-36">

// NOVO
<div className="flex items-end justify-between gap-1 sm:gap-2 flex-1 h-36 px-2">
```

**Alteracao 3 - Largura das barras (linha 228 e 234):**
```typescript
// ATUAL
className="flex flex-col items-center gap-2 ... flex-1 max-w-[80px]"
className="w-full max-w-[56px] rounded-t ..."

// NOVO
className="flex flex-col items-center gap-1 ... flex-1 max-w-[60px]"
className="w-full max-w-[40px] rounded-t ..."
```

---

## Parte 2: Mes Selecionado Inicial = Mes Vigente

### Arquivo: `src/pages/FinancialInvoices.tsx`

O estado ja esta correto (linha 74):
```typescript
const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
```

### Arquivo: `src/pages/agency/AgencyInvoices.tsx`

Verificar se o estado tambem inicializa com mes atual. Se nao, corrigir.

---

## Parte 3: Contagem de Meses a partir de Janeiro/2026

### Arquivo: `src/hooks/useMonthlyInvoiceSummary.ts`

**Alteracao - Linhas 32-61:**

```typescript
// ATUAL - Gera 12 meses para tras e 12 para frente do mes atual
for (let i = -12; i <= 12; i++) {
  // ...
}

// NOVO - Gera de Janeiro/2026 ate mes atual + 12 meses
const startYear = 2026;
const startMonth = 1; // Janeiro

// Calcular quantos meses desde Jan/2026 ate mes atual + 12 meses futuros
const endMonth = currentMonth;
const endYear = currentYear + 1; // 12 meses adiante

let year = startYear;
let month = startMonth;

while (year < endYear || (year === endYear && month <= endMonth)) {
  months.push({
    month,
    year,
    totalValue: 0,
    status: 'futura',
    invoiceCount: 0,
    hasInvoice: false
  });
  
  month++;
  if (month > 12) {
    month = 1;
    year++;
  }
}
```

**Logica:**
- Inicio fixo: Janeiro/2026 (primeiro mes do sistema de faturamento)
- Fim dinamico: mes atual + 12 meses para o futuro
- Nao exibe meses anteriores a Jan/2026

---

## Parte 4: Navegacao do Grafico (Inicio no Mes Atual)

### Arquivo: `src/components/invoices/MonthlyInvoiceChart.tsx`

**Alteracao no calculo do offset inicial (linhas 85-89):**

```typescript
// ATUAL - Centraliza no mes selecionado
const [offset, setOffset] = useState(() => {
  const selectedIndex = data.findIndex(m => m.month === selectedMonth && m.year === selectedYear);
  const targetIndex = selectedIndex >= 0 ? selectedIndex : currentMonthIndex;
  return Math.max(0, targetIndex - Math.floor(MONTHS_VISIBLE / 2));
});

// NOVO - Posiciona para que o mes atual apareca na tela (nao necessariamente centralizado)
const [offset, setOffset] = useState(() => {
  const now = new Date();
  const currentMonthIndex = data.findIndex(
    m => m.month === now.getMonth() + 1 && m.year === now.getFullYear()
  );
  
  if (currentMonthIndex < 0) return 0;
  
  // Posicionar o mes atual mais a esquerda se estivermos no inicio do ano
  // Ou centralizar se houver meses suficientes antes
  const idealOffset = Math.max(0, currentMonthIndex - Math.floor(MONTHS_VISIBLE / 3));
  return Math.min(idealOffset, Math.max(0, data.length - MONTHS_VISIBLE));
});
```

---

## Parte 5: Melhorar Pagina de Detalhe da Fatura (Tridots)

### Arquivo: `src/pages/InvoiceDetail.tsx`

**Acoes faltantes identificadas:**
1. Upload de boleto (PDF)
2. Botao para alterar status (Enviar fatura)
3. Botao para cancelar fatura
4. Link para acessar o contrato de cada parcela

**Alteracao 1 - Adicionar acoes no header (linhas 80-93):**

```typescript
<div className="flex gap-2">
  {/* Upload de Boleto */}
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => setShowBoletoUpload(true)}
  >
    <Upload className="h-4 w-4 mr-2" />
    {(invoice as any).boleto_url ? 'Trocar Boleto' : 'Upload Boleto'}
  </Button>

  {/* Download Boleto (se existir) */}
  {(invoice as any).boleto_url && (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => window.open((invoice as any).boleto_url, '_blank')}
    >
      <Download className="h-4 w-4 mr-2" />
      Ver Boleto
    </Button>
  )}

  {/* Enviar Fatura (mudar status para 'enviada') */}
  {invoice.status === 'rascunho' && (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => handleChangeStatus('enviada')}
    >
      <Send className="h-4 w-4 mr-2" />
      Enviar Fatura
    </Button>
  )}

  {/* Cancelar Fatura */}
  {invoice.status !== 'paga' && invoice.status !== 'cancelada' && (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={() => setShowCancelDialog(true)}
    >
      Cancelar Fatura
    </Button>
  )}
</div>
```

**Alteracao 2 - Na tabela de itens, adicionar link para contrato (linha 148):**

```typescript
<TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
  <TableCell className="font-mono text-sm">
    <Button 
      variant="link" 
      className="p-0 h-auto"
      onClick={() => navigate(`/contracts/${item.analysis_id || item.contract_id}`)}
    >
      {item.contract_id.slice(0, 8)}
    </Button>
  </TableCell>
  {/* ... resto das colunas */}
</TableRow>
```

**Alteracao 3 - Adicionar funcoes de manipulacao de status:**

```typescript
const handleChangeStatus = async (newStatus: string) => {
  const { error } = await supabase
    .from('agency_invoices')
    .update({ status: newStatus })
    .eq('id', invoiceId);
  
  if (error) {
    toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  } else {
    toast({ title: 'Status atualizado' });
    queryClient.invalidateQueries({ queryKey: ['invoice_detail'] });
  }
};

const handleCancelInvoice = async () => {
  // Cancelar fatura e liberar parcelas
  const { error } = await supabase.rpc('cancel_invoice', { invoice_id: invoiceId });
  
  if (error) {
    toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  } else {
    toast({ title: 'Fatura cancelada' });
    navigate('/invoices');
  }
};
```

**Alteracao 4 - Adicionar modal/dialog para upload de boleto:**

Criar componente simples de upload que:
1. Abre um file picker para PDF
2. Faz upload para o storage
3. Atualiza a coluna `boleto_url` na tabela `agency_invoices`

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/invoices/MonthlyInvoiceChart.tsx` | Mostrar 12 meses, ajustar offset inicial |
| `src/hooks/useMonthlyInvoiceSummary.ts` | Comecar em Jan/2026 |
| `src/pages/InvoiceDetail.tsx` | Adicionar acoes (upload, enviar, cancelar, link contrato) |

---

## Resultado Esperado

1. Grafico mostrando Jan a Dez (12 barras)
2. Ao abrir o modulo, mes atual ja selecionado
3. Nao permite navegar para antes de Jan/2026
4. Pagina de detalhe da fatura com todas as acoes necessarias:
   - Upload de boleto
   - Ver/baixar boleto
   - Enviar fatura
   - Cancelar fatura
   - Link para acessar cada contrato
   - Registrar pagamento (ja existe)

