import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MoreHorizontal, Eye, MessageSquare, FileText, Loader2, FileSearch, CheckCircle, Clock, XCircle, FileCheck, ShieldAlert, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/validators';
import { format, addDays, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';
import { useContractsWithActiveClaims } from '@/hooks/useContractsWithActiveClaims';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

interface Contract {
  id: string;
  status: ContractStatus;
  created_at: string;
  activated_at: string | null;
  data_fim_contrato?: string | null;
  doc_contrato_locacao_status?: string | null;
  doc_vistoria_inicial_status?: string | null;
  doc_seguro_incendio_status?: string | null;
  analysis: {
    id: string;
    inquilino_nome: string;
    inquilino_cpf: string;
    valor_aluguel: number;
    payments_validated_at?: string | null;
    guarantee_payment_date?: string | null;
    valor_total: number | null;
    taxa_garantia_percentual: number | null;
    garantia_anual: number | null;
    identity_photo_path: string | null;
  } | null;
}

interface AgencyContractListProps {
  contracts: Contract[];
  isLoading: boolean;
  onRefresh: () => void;
  autoOpenContractId?: string | null;
  onAutoOpenHandled?: () => void;
  initialStatusFilter?: string;
  initialRenewalFilter?: boolean;
}

const STATUS_CONFIG: Record<ContractStatus | 'renewal', { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  documentacao_pendente: { label: 'Doc. Pendente', variant: 'outline', icon: FileCheck },
  ativo: { label: 'Ativo', variant: 'default', icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  encerrado: { label: 'Encerrado', variant: 'secondary', icon: Clock },
  vencido: { label: 'Vencido', variant: 'outline', icon: CalendarClock },
  renewal: { label: 'Para Renovar', variant: 'outline', icon: CalendarClock },
};

export function AgencyContractList({ 
  contracts, 
  isLoading, 
  onRefresh, 
  autoOpenContractId, 
  onAutoOpenHandled,
  initialStatusFilter,
  initialRenewalFilter
}: AgencyContractListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || (initialRenewalFilter ? 'renewal' : 'all'));
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();
  
  const contractIds = useMemo(() => contracts.map(c => c.id), [contracts]);
  const { data: contractsWithActiveClaims } = useContractsWithActiveClaims(contractIds);

  // Update filter when initial values change
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    } else if (initialRenewalFilter) {
      setStatusFilter('renewal');
    }
  }, [initialStatusFilter, initialRenewalFilter]);

  // Auto-open contract from notification
  useEffect(() => {
    if (autoOpenContractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === autoOpenContractId || c.analysis?.id === autoOpenContractId);
      if (contract) {
        navigate(`/agency/contracts/${contract.analysis?.id || contract.id}`);
        onAutoOpenHandled?.();
      }
    }
  }, [autoOpenContractId, contracts, navigate, onAutoOpenHandled]);

  // Filter contracts
  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);
  
  const filteredContracts = contracts.filter(contract => {
    if (!contract.analysis) return false;
    
    const matchesSearch = 
      contract.analysis.inquilino_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.analysis.inquilino_cpf.includes(searchTerm.replace(/\D/g, ''));
    
    // Handle renewal filter (expiring in next 30 days OR already expired up to 30 days ago)
    if (statusFilter === 'renewal') {
      const hasRenewalDate = contract.data_fim_contrato;
      if (!hasRenewalDate) return false;
      const endDate = parseISO(contract.data_fim_contrato);
      const thirtyDaysAgo = addDays(now, -30);
      const isRenewalPeriod = contract.status === 'ativo' && 
        isWithinInterval(endDate, { start: thirtyDaysAgo, end: thirtyDaysFromNow });
      return matchesSearch && isRenewalPeriod;
    }
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Contratos ({filteredContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum contrato encontrado</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm">Tente ajustar os filtros</p>
              ) : (
                <p className="text-sm">Contratos serão criados após aprovação e pagamento das análises</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Locatício</TableHead>
                    <TableHead className="text-right">Cobertura</TableHead>
                    <TableHead className="text-center">Taxa %</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const statusConfig = STATUS_CONFIG[contract.status];
                    const StatusIcon = statusConfig.icon;
                    const analysisId = contract.analysis?.id;
                    const hasUnread = analysisId ? (unreadIds?.contratos.has(analysisId) ?? false) : false;
                    const hasRejectedDoc = 
                      contract.doc_contrato_locacao_status === 'rejeitado' ||
                      contract.doc_vistoria_inicial_status === 'rejeitado' ||
                      contract.doc_seguro_incendio_status === 'rejeitado';
                    // Check if contract has an active claim
                    const hasActiveClaim = contractsWithActiveClaims?.has(contract.id) ?? false;

                    const handleRowClick = () => {
                      if (hasUnread && analysisId) {
                        markAsRead(analysisId, 'contratos');
                      }
                      navigate(`/agency/contracts/${analysisId}`);
                    };

                    return (
                      <TableRow 
                        key={contract.id} 
                        className={cn(
                          "hover:bg-muted/30 cursor-pointer relative",
                          hasUnread && "bg-red-50/50 dark:bg-red-950/20"
                        )}
                        onClick={handleRowClick}
                      >
                        <TableCell className="font-mono text-xs">
                          {hasUnread && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r"></span>
                          )}
                          #{contract.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contract.analysis?.inquilino_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCpf(contract.analysis?.inquilino_cpf || '')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusConfig.variant} className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {hasRejectedDoc && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                Doc. Rejeitado
                              </Badge>
                            )}
                            {hasActiveClaim && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400 text-xs">
                                <span className="relative flex h-2 w-2 mr-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Garantia
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contract.analysis?.valor_total || contract.analysis?.valor_aluguel || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {contract.analysis?.garantia_anual 
                            ? formatCurrency(contract.analysis.garantia_anual)
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {contract.analysis?.taxa_garantia_percentual?.toFixed(1) || '-'}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contract.analysis?.guarantee_payment_date 
                            ? format(new Date(contract.analysis.guarantee_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                            : contract.analysis?.payments_validated_at 
                              ? format(new Date(contract.analysis.payments_validated_at), 'dd/MM/yyyy', { locale: ptBR })
                              : format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/agency/contracts/${analysisId}`);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/agency/support', { 
                                    state: { 
                                      prefillSubject: `Dúvida sobre contrato #${contract.id.slice(0, 8).toUpperCase()}`,
                                      analysisId: analysisId
                                    } 
                                  });
                                }}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Abrir Chamado
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/agency/contracts/${analysisId}?tab=documents`);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Documentos
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}