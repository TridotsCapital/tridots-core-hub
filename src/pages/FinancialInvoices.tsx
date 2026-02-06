import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAgencyInvoices, type InvoiceFilter } from '@/hooks/useAgencyInvoices';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Download, DollarSign, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  rascunho: 'bg-secondary text-secondary-foreground',
  gerada: 'bg-blue-100 text-blue-800',
  enviada: 'bg-blue-200 text-blue-900',
  atrasada: 'bg-destructive/10 text-destructive',
  paga: 'bg-green-100 text-green-800',
  cancelada: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  gerada: 'Gerada',
  enviada: 'Enviada',
  atrasada: 'Atrasada',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export default function FinancialInvoices() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InvoiceFilter>({});
  const [searchAgency, setSearchAgency] = useState('');

  const { data: invoices = [], isLoading } = useAgencyInvoices(filters);
  // For analytics, pass date filters if they exist
  const analyticsFilters = filters as unknown as { fromDate?: string; toDate?: string };
  const { data: analytics, isLoading: analyticsLoading } = useInvoiceAnalytics(analyticsFilters);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchAgency) return true;
    const agencyName = inv.agencies?.razao_social || '';
    return agencyName.toLowerCase().includes(searchAgency.toLowerCase());
  });

  const totalValue = filteredInvoices.reduce((sum, inv) => sum + (inv.adjusted_value || inv.total_value || 0), 0);
  const paidValue = filteredInvoices.filter(inv => inv.status === 'paga').reduce((sum, inv) => sum + (inv.paid_value || 0), 0);
  const pendingValue = totalValue - paidValue;
  
  const kpiData = analytics || {
    totalToReceive: 0,
    totalReceived: 0,
    totalOverdue: 0,
    blockedAgenciesCount: 0,
    alertsCount: 0
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
         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           <div className="bg-background rounded-lg border border-primary/20 p-4">
             <p className="text-sm text-muted-foreground mb-1">Total a Receber</p>
             <p className="text-2xl font-bold text-primary">R$ {kpiData.totalToReceive.toFixed(2)}</p>
           </div>
           <div className="bg-background rounded-lg border border-primary/20 p-4">
             <p className="text-sm text-muted-foreground mb-1">Recebido</p>
             <p className="text-2xl font-bold text-primary">R$ {kpiData.totalReceived.toFixed(2)}</p>
           </div>
           <div className="bg-background rounded-lg border border-destructive/20 p-4">
             <p className="text-sm text-muted-foreground mb-1">Atrasado</p>
             <p className="text-2xl font-bold text-destructive">R$ {kpiData.totalOverdue.toFixed(2)}</p>
           </div>
           <div className="bg-background rounded-lg border border-destructive/20 p-4">
             <p className="text-sm text-muted-foreground mb-1">Agências Bloqueadas</p>
             <p className="text-2xl font-bold text-destructive">{kpiData.blockedAgenciesCount}</p>
           </div>
           <div className="bg-background rounded-lg border border-destructive/20 p-4">
             <p className="text-sm text-muted-foreground mb-1">Alertas Vencimento</p>
             <p className="text-2xl font-bold text-destructive">{kpiData.alertsCount}</p>
           </div>
         </div>

        {/* Filtros */}
        <div className="bg-background rounded-lg border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por imobiliária..."
              value={searchAgency}
              onChange={(e) => setSearchAgency(e.target.value)}
            />
            <Select value={filters.status || ''} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="gerada">Gerada</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.referenceYear?.toString() || ''} onValueChange={(v) => handleFilterChange('referenceYear', v ? parseInt(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Tabela de Faturas */}
        <div className="bg-background rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imobiliária</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando faturas...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma fatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm">{invoice.agencies?.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{invoice.agencies?.cnpj}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.reference_month.toString().padStart(2, '0')}/{invoice.reference_year}
                    </TableCell>
                    <TableCell>
                      R$ {(invoice.adjusted_value || invoice.total_value || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'paga' ? (
                        <span className="text-primary font-medium">
                          R$ {(invoice.paid_value || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/financial/invoices/${invoice.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(invoice as any).boleto_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open((invoice as any).boleto_url, '_blank')}
                            title="Baixar boleto"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {['rascunho', 'gerada', 'enviada', 'atrasada'].includes(invoice.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/financial/invoices/${invoice.id}?tab=payment`)}
                            title="Registrar pagamento"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
