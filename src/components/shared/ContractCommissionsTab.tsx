import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, CheckCircle, ArrowUpRight, CalendarDays, Repeat } from 'lucide-react';
import { useContractCommissions, useContractCommissionsSummary } from '@/hooks/useContractCommissions';
import { formatCurrency } from '@/lib/validators';
import { cn, formatDateBR } from '@/lib/utils';
import type { CommissionStatus, CommissionType, PlanType } from '@/types/database';
import { GUARANTEE_PLANS } from '@/lib/plans';

interface ContractCommissionsTabProps {
  analysisId: string;
  planoGarantia?: PlanType | null;
}

const STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendente: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: Clock },
  a_pagar: { label: 'A Pagar', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: ArrowUpRight },
  paga: { label: 'Paga', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  estornada: { label: 'Estornada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: Clock },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: Clock },
};

const TYPE_LABELS: Record<CommissionType, string> = {
  setup: 'Setup',
  recorrente: 'Recorrente',
};

export function ContractCommissionsTab({ analysisId, planoGarantia }: ContractCommissionsTabProps) {
  const { data: commissions, isLoading } = useContractCommissions(analysisId);
  const { data: summary, isLoading: isSummaryLoading } = useContractCommissionsSummary(analysisId);

  if (isLoading || isSummaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!commissions || commissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma comissão encontrada para este contrato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = planoGarantia && GUARANTEE_PLANS[planoGarantia];

  // Calculate timeline progress
  const paidCount = commissions.filter(c => c.status === 'paga').length;
  const totalRecorrente = commissions.filter(c => c.type === 'recorrente').length;
  const progressPercentage = totalRecorrente > 0 ? (paidCount / commissions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Total Geral
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary?.total || 0)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              Pendente
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(summary?.pendente || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm mb-1">
              <ArrowUpRight className="h-4 w-4" />
              A Pagar
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(summary?.a_pagar || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              Pago
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary?.paga || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visual */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Timeline de Pagamentos
              </CardTitle>
              <CardDescription>
                {paidCount} de {commissions.length} comissões pagas ({Math.round(progressPercentage)}%)
              </CardDescription>
            </div>
            {plan && (
              <Badge className={plan.badgeClass}>
                Plano {plan.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Month indicators */}
          <TooltipProvider>
            <div className="flex justify-between gap-1">
              {commissions.map((commission, index) => {
                const StatusIcon = STATUS_CONFIG[commission.status]?.icon || Clock;
                const isSetup = commission.type === 'setup';
                
                return (
                  <Tooltip key={commission.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex-1 h-8 rounded flex items-center justify-center cursor-pointer transition-all',
                          commission.status === 'paga' && 'bg-green-500 text-white',
                          commission.status === 'a_pagar' && 'bg-amber-500 text-white',
                          commission.status === 'pendente' && 'bg-muted text-muted-foreground',
                          commission.status === 'estornada' && 'bg-red-500 text-white',
                          isSetup && 'border-2 border-primary'
                        )}
                      >
                        <span className="text-xs font-medium">
                          {isSetup ? 'S' : index}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{isSetup ? 'Setup' : `Mês ${commission.mes_referencia}`}</p>
                      <p className="text-xs">{formatCurrency(commission.valor)}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {commission.due_date ? formatDateBR(commission.due_date) : '-'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Detalhamento das Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Mês/Ref</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Base Cálculo</TableHead>
                <TableHead className="text-right">Taxa %</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => {
                const statusConfig = STATUS_CONFIG[commission.status];
                const StatusIcon = statusConfig?.icon || Clock;
                
                return (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[commission.type] || commission.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {commission.type === 'setup' 
                        ? '-' 
                        : `${String(commission.mes_referencia).padStart(2, '0')}/${commission.ano_referencia}`}
                    </TableCell>
                    <TableCell>
                      {commission.due_date 
                        ? formatDateBR(commission.due_date)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(commission.base_calculo || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {commission.percentual_comissao}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(commission.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusConfig?.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig?.label || commission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
