import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMonthlyInvoiceSummary, useAgenciesWithInvoiceInMonth } from '@/hooks/useMonthlyInvoiceSummary';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import { MonthlyInvoiceChart } from '@/components/invoices/MonthlyInvoiceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Lock, FileText, Loader2, Building2, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
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

const months = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function FinancialInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Dialog state for generating drafts
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftMonth, setDraftMonth] = useState(String(currentDate.getMonth() + 1));
  const [draftYear, setDraftYear] = useState(String(currentDate.getFullYear()));

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

  const handleGenerateDrafts = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-drafts', {
        body: {
          reference_month: parseInt(draftMonth),
          reference_year: parseInt(draftYear)
        }
      });

      if (error) throw error;

      const result = data as { invoices_created?: number; agencies_processed?: number };
      
      toast({
        title: 'Rascunhos gerados com sucesso',
        description: `${result.invoices_created || 0} fatura(s) gerada(s) para ${result.agencies_processed || 0} agência(s)`
      });
      
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['monthly_invoice_summary'] });
      queryClient.invalidateQueries({ queryKey: ['agencies_invoice_month'] });
    } catch (error: any) {
      console.error('Error generating drafts:', error);
      toast({
        title: 'Erro ao gerar rascunhos',
        description: error.message || 'Ocorreu um erro ao processar a solicitação',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateForAgency = async (agencyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-drafts', {
        body: {
          reference_month: selectedMonth,
          reference_year: selectedYear,
          agency_id: agencyId
        }
      });

      if (error) throw error;
      
      toast({
        title: 'Fatura gerada',
        description: 'Rascunho de fatura criado com sucesso'
      });
      
      queryClient.invalidateQueries({ queryKey: ['monthly_invoice_summary'] });
      queryClient.invalidateQueries({ queryKey: ['agencies_invoice_month'] });
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar fatura',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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

        {/* QUADRANTE 1: Resumo do mês + Gráfico de barras */}
        <MonthlyInvoiceChart
          data={monthlySummary}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonth={handleSelectMonth}
          isLoading={summaryLoading}
          agencyCount={agencies.length}
          showStatus={false}
        />

        {/* Action: Generate Drafts */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Gerar Rascunhos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Rascunhos de Faturas</DialogTitle>
                <DialogDescription>
                  Gere faturas em rascunho para todas as agências com parcelas pendentes no período selecionado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês de Referência</label>
                  <Select value={draftMonth} onValueChange={setDraftMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano de Referência</label>
                  <Select value={draftYear} onValueChange={setDraftYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateDrafts} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isGenerating ? 'Gerando...' : 'Gerar Rascunhos'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* QUADRANTE 2: Lista de Imobiliárias com faturas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Detalhes das Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agenciesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : agencies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Nenhuma imobiliária com fatura ou parcelas neste período.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agencies.map((agency) => (
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
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">{formatCurrency(agency.totalValue)}</p>
                      
                      <Button
                        variant={agency.invoiceId ? "outline" : "default"}
                        size="sm"
                        onClick={async () => {
                          if (agency.invoiceId) {
                            navigate(`/invoices/${agency.invoiceId}`);
                          } else {
                            try {
                              const { data, error } = await supabase.functions.invoke('generate-invoice-drafts', {
                                body: {
                                  reference_month: selectedMonth,
                                  reference_year: selectedYear,
                                  agency_id: agency.agencyId
                                }
                              });
                              if (error) throw error;
                              
                              // Refresh data then navigate to the newly created invoice
                              await queryClient.invalidateQueries({ queryKey: ['monthly_invoice_summary'] });
                              await queryClient.invalidateQueries({ queryKey: ['agencies_invoice_month'] });
                              
                              // Fetch the created invoice to navigate
                              const { data: invoice } = await supabase
                                .from('agency_invoices')
                                .select('id')
                                .eq('agency_id', agency.agencyId)
                                .eq('reference_month', selectedMonth)
                                .eq('reference_year', selectedYear)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                              
                              if (invoice) {
                                navigate(`/invoices/${invoice.id}`);
                              } else {
                                toast({ title: 'Fatura gerada', description: 'Rascunho de fatura criado com sucesso' });
                              }
                            } catch (error: any) {
                              toast({ title: 'Erro ao gerar fatura', description: error.message, variant: 'destructive' });
                            }
                          }
                        }}
                        className="gap-2"
                      >
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
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
