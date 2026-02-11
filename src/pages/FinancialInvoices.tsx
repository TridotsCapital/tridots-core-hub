import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMonthlyInvoiceSummary, useAgenciesWithInvoiceInMonth } from '@/hooks/useMonthlyInvoiceSummary';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import { MonthlyInvoiceChart } from '@/components/invoices/MonthlyInvoiceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, Building2, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  rascunho: 'bg-secondary text-secondary-foreground',
  gerada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  enviada: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
  atrasada: 'bg-destructive/10 text-destructive',
  paga: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelada: 'bg-muted text-muted-foreground',
  futura: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  gerada: 'Gerada',
  enviada: 'Enviada',
  atrasada: 'Atrasada',
  paga: 'Paga',
  cancelada: 'Cancelada',
  futura: 'Aguardando Faturamento',
};

const dueDayOptions = [
  { value: null, label: 'Todos' },
  { value: 5, label: 'Dia 5' },
  { value: 10, label: 'Dia 10' },
  { value: 15, label: 'Dia 15' },
] as const;

export default function FinancialInvoices() {
  const navigate = useNavigate();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [dueDayFilter, setDueDayFilter] = useState<number | null>(null);

  // Hooks
  const { data: monthlySummary = [], isLoading: summaryLoading } = useMonthlyInvoiceSummary();
  const { data: agencies = [], isLoading: agenciesLoading } = useAgenciesWithInvoiceInMonth(selectedMonth, selectedYear);
  const { data: analytics } = useInvoiceAnalytics({});

  const kpiData = analytics || {
    totalToReceive: 0,
    totalReceived: 0,
    totalOverdue: 0,
    blockedAgenciesCount: 0,
    alertsCount: 0
  };

  const handleSelectMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Filtrar agências pelo dia de vencimento
  const filteredAgencies = dueDayFilter
    ? agencies.filter((a) => a.billingDueDay === dueDayFilter)
    : agencies;

  return (
    <DashboardLayout
      title="Faturas Unificadas"
      description="Gestão de faturas de garantia por imobiliária"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Alerts */}
        {kpiData.blockedAgenciesCount > 0 && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              {kpiData.blockedAgenciesCount} agência(s) bloqueada(s) por falta de pagamento
            </AlertDescription>
          </Alert>
        )}
        {kpiData.alertsCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {kpiData.alertsCount} fatura(s) vencendo nos próximos 5 dias
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Total a Receber</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(kpiData.totalToReceive)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Recebido</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(kpiData.totalReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Atrasado</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(kpiData.totalOverdue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Bloqueadas</p>
              <p className="text-xl font-bold text-destructive">{kpiData.blockedAgenciesCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Alertas</p>
              <p className="text-xl font-bold text-destructive">{kpiData.alertsCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico mensal */}
        <MonthlyInvoiceChart
          data={monthlySummary}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonth={handleSelectMonth}
          isLoading={summaryLoading}
          agencyCount={agencies.length}
          showStatus={false}
        />

        {/* Lista de Imobiliárias com faturas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Detalhes das Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtro por dia de vencimento */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground mr-1">Vencimento:</span>
              {dueDayOptions.map((opt) => (
                <Button
                  key={opt.label}
                  variant={dueDayFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDueDayFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {agenciesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredAgencies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Nenhuma imobiliária com fatura neste período{dueDayFilter ? ` para vencimento dia ${dueDayFilter}` : ''}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAgencies.map((agency) => (
                  <div 
                    key={agency.agencyId} 
                    className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold truncate">{agency.agencyName}</h4>
                        <Badge className={statusColors[agency.status]}>
                          {statusLabels[agency.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {agency.cnpj}
                        {agency.dueDate && ` • Vencimento: ${format(new Date(agency.dueDate), 'dd/MM/yyyy')}`}
                        {agency.billingDueDay && ` • Dia ${agency.billingDueDay}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">{formatCurrency(agency.totalValue)}</p>
                      
                      {agency.invoiceId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/invoices/${agency.invoiceId}`)}
                          className="gap-2"
                        >
                          Ver Detalhes
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
