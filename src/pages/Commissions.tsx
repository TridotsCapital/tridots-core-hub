import { useState } from 'react';
import { useCommissions, useUpdateCommissionStatus } from '@/hooks/useCommissions';
import { useAgencies } from '@/hooks/useAgencies';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, DollarSign, MoreHorizontal, CheckCircle, XCircle, RotateCcw, Clock, Wallet } from 'lucide-react';
import { commissionStatusConfig, CommissionStatus } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { GUARANTEE_PLANS, type PlanType } from '@/lib/plans';

const getPlanBadge = (plano: string | null | undefined) => {
  if (!plano) return null;
  const plan = GUARANTEE_PLANS[plano as PlanType];
  if (!plan) return null;
  return (
    <Badge className={plan.badgeClass}>
      {plan.emoji} {plan.name}
    </Badge>
  );
};

export default function Commissions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | 'all'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const { isMaster } = useAuth();

  const { data: agencies } = useAgencies();
  const { data: commissions, isLoading } = useCommissions({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
  });
  const updateStatus = useUpdateCommissionStatus();

  const filteredCommissions = commissions?.filter(commission => 
    commission.analysis?.inquilino_nome?.toLowerCase().includes(search.toLowerCase()) ||
    commission.agency?.razao_social?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalPending = filteredCommissions?.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0) || 0;
  const totalToPay = filteredCommissions?.filter(c => c.status === 'a_pagar').reduce((acc, c) => acc + c.valor, 0) || 0;
  const totalPaid = filteredCommissions?.filter(c => c.status === 'paga').reduce((acc, c) => acc + c.valor, 0) || 0;

  const handleStatusChange = async (id: string, status: CommissionStatus) => {
    await updateStatus.mutateAsync({ id, status });
  };

  return (
    <DashboardLayout title="Comissões" description="Gestão de comissões das imobiliárias">
      <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalToPay)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagas</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total (filtrado)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending + totalToPay + totalPaid)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por inquilino ou imobiliária..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CommissionStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="a_pagar">A Pagar</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="estornada">Estornada</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCommissions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma comissão encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Base Cálculo</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    {isMaster && <TableHead className="w-[80px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions?.map((commission) => (
                    <TableRow key={commission.id}>
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
                        {getPlanBadge((commission.analysis as any)?.plano_garantia)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {commission.base_calculo ? formatCurrency(commission.base_calculo) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {commission.percentual_comissao ? `${commission.percentual_comissao}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          {formatCurrency(commission.valor)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {commission.due_date ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(commission.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`status-badge ${commissionStatusConfig[commission.status].class}`}
                        >
                          {commissionStatusConfig[commission.status].label}
                        </Badge>
                      </TableCell>
                      {isMaster && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={updateStatus.isPending}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(commission.status === 'pendente' || commission.status === 'a_pagar') && (
                                <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'paga')}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                  Marcar como paga
                                </DropdownMenuItem>
                              )}
                              {commission.status === 'paga' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'estornada')}>
                                  <RotateCcw className="h-4 w-4 mr-2 text-destructive" />
                                  Estornar
                                </DropdownMenuItem>
                              )}
                              {commission.status !== 'cancelada' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(commission.id, 'cancelada')}>
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
      </div>
    </DashboardLayout>
  );
}
