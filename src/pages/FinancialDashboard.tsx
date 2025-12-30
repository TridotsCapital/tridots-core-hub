import { useState } from 'react';
import { useCommissions, useFinancialSummary, useBulkUpdateCommissions } from '@/hooks/useCommissions';
import { useAgencies } from '@/hooks/useAgencies';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RotateCcw,
  CreditCard,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { commissionStatusConfig, CommissionStatus } from '@/types/database';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateCommissionStatus } from '@/hooks/useCommissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function FinancialDashboard() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  
  const { isMaster } = useAuth();
  const { data: agencies } = useAgencies();
  
  const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  
  const { data: summary } = useFinancialSummary(subMonths(startDate, 12), endDate);
  const { data: commissions, isLoading } = useCommissions({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
    month: selectedMonth,
    year: selectedYear,
  });
  
  const updateStatus = useUpdateCommissionStatus();
  const bulkUpdate = useBulkUpdateCommissions();

  // Calculate current month totals
  const currentMonthData = commissions || [];
  const pendingTotal = currentMonthData.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0);
  const paidTotal = currentMonthData.filter(c => c.status === 'paga').reduce((sum, c) => sum + c.valor, 0);
  const setupTotal = currentMonthData.filter(c => c.type === 'setup').reduce((sum, c) => sum + c.valor, 0);
  const recurringTotal = currentMonthData.filter(c => c.type === 'recorrente').reduce((sum, c) => sum + c.valor, 0);

  // Calculate gross/net (simplified - gross is all, net is paid)
  const grossRevenue = pendingTotal + paidTotal;
  const netRevenue = paidTotal;

  const handleStatusChange = async (id: string, status: CommissionStatus) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleBulkPay = async () => {
    if (selectedCommissions.length === 0) return;
    await bulkUpdate.mutateAsync({ ids: selectedCommissions, status: 'paga' });
    setSelectedCommissions([]);
  };

  const toggleSelectAll = () => {
    const pendingIds = currentMonthData.filter(c => c.status === 'pendente').map(c => c.id);
    if (selectedCommissions.length === pendingIds.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(pendingIds);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

  return (
    <DashboardLayout title="Painel Financeiro" description="Visão consolidada de faturamento e comissões">
      <div className="space-y-6 animate-fade-in">
        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Faturamento Bruto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(grossRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total de comissões no período
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Faturamento Líquido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{formatCurrency(netRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comissões já pagas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                A Pagar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{formatCurrency(pendingTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comissões pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Imobiliárias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{new Set(currentMonthData.map(c => c.agency_id)).size}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Com comissões no período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Comissões de Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(setupTotal)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentMonthData.filter(c => c.type === 'setup').length} comissões de setup
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Comissões Recorrentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(recurringTotal)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentMonthData.filter(c => c.type === 'recorrente').length} comissões recorrentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commissions Table */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="paga">Pagas</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as imobiliárias</SelectItem>
                  {agencies?.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCommissions.length > 0 && isMaster && (
                <Button onClick={handleBulkPay} disabled={bulkUpdate.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pagar {selectedCommissions.length} selecionadas
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <CommissionsTable
              commissions={currentMonthData}
              isLoading={isLoading}
              isMaster={isMaster}
              selectedCommissions={selectedCommissions}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onStatusChange={handleStatusChange}
              updatePending={updateStatus.isPending}
            />
          </TabsContent>

          <TabsContent value="pendente" className="m-0">
            <CommissionsTable
              commissions={currentMonthData.filter(c => c.status === 'pendente')}
              isLoading={isLoading}
              isMaster={isMaster}
              selectedCommissions={selectedCommissions}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onStatusChange={handleStatusChange}
              updatePending={updateStatus.isPending}
            />
          </TabsContent>

          <TabsContent value="paga" className="m-0">
            <CommissionsTable
              commissions={currentMonthData.filter(c => c.status === 'paga')}
              isLoading={isLoading}
              isMaster={isMaster}
              selectedCommissions={selectedCommissions}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onStatusChange={handleStatusChange}
              updatePending={updateStatus.isPending}
              showSelection={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Separate table component for reuse
function CommissionsTable({
  commissions,
  isLoading,
  isMaster,
  selectedCommissions,
  onToggleSelect,
  onToggleSelectAll,
  onStatusChange,
  updatePending,
  showSelection = true,
}: {
  commissions: any[];
  isLoading: boolean;
  isMaster: boolean;
  selectedCommissions: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onStatusChange: (id: string, status: CommissionStatus) => void;
  updatePending: boolean;
  showSelection?: boolean;
}) {
  const pendingIds = commissions.filter(c => c.status === 'pendente').map(c => c.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every(id => selectedCommissions.includes(id));

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <DollarSign className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma comissão encontrada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showSelection && isMaster && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onToggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Tipo</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Imobiliária</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pgto</TableHead>
                {isMaster && <TableHead className="w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  {showSelection && isMaster && (
                    <TableCell>
                      {commission.status === 'pendente' && (
                        <Checkbox
                          checked={selectedCommissions.includes(commission.id)}
                          onCheckedChange={() => onToggleSelect(commission.id)}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={commission.type === 'setup' ? 'default' : 'secondary'}>
                      {commission.type === 'setup' ? 'Setup' : 'Recorrente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {commission.analysis?.inquilino_nome || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {commission.agency?.razao_social || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {commission.mes_referencia && commission.ano_referencia ? (
                      <span className="text-sm text-muted-foreground">
                        {String(commission.mes_referencia).padStart(2, '0')}/{commission.ano_referencia}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.valor)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`status-badge ${commissionStatusConfig[commission.status as CommissionStatus].class}`}
                    >
                      {commissionStatusConfig[commission.status as CommissionStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {commission.data_pagamento ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(commission.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {isMaster && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={updatePending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {commission.status === 'pendente' && (
                            <DropdownMenuItem onClick={() => onStatusChange(commission.id, 'paga')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-success" />
                              Marcar como paga
                            </DropdownMenuItem>
                          )}
                          {commission.status === 'paga' && (
                            <DropdownMenuItem onClick={() => onStatusChange(commission.id, 'estornada')}>
                              <RotateCcw className="h-4 w-4 mr-2 text-destructive" />
                              Estornar
                            </DropdownMenuItem>
                          )}
                          {commission.status !== 'cancelada' && (
                            <DropdownMenuItem onClick={() => onStatusChange(commission.id, 'cancelada')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
