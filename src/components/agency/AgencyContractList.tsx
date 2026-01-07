import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MoreHorizontal, Eye, MessageSquare, FileText, Loader2, FileSearch, CheckCircle, Clock, XCircle, FileCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

interface Contract {
  id: string;
  status: ContractStatus;
  created_at: string;
  activated_at: string | null;
  doc_contrato_locacao_status?: string | null;
  doc_vistoria_inicial_status?: string | null;
  doc_seguro_incendio_status?: string | null;
  analysis: {
    id: string;
    inquilino_nome: string;
    inquilino_cpf: string;
    valor_aluguel: number;
    valor_total: number | null;
    identity_photo_path: string | null;
  } | null;
}

interface AgencyContractListProps {
  contracts: Contract[];
  isLoading: boolean;
  onRefresh: () => void;
  autoOpenContractId?: string | null;
  onAutoOpenHandled?: () => void;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  documentacao_pendente: { label: 'Doc. Pendente', variant: 'outline', icon: FileCheck },
  ativo: { label: 'Ativo', variant: 'default', icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  encerrado: { label: 'Encerrado', variant: 'secondary', icon: Clock },
};

export function AgencyContractList({ contracts, isLoading, onRefresh, autoOpenContractId, onAutoOpenHandled }: AgencyContractListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

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
  const filteredContracts = contracts.filter(contract => {
    if (!contract.analysis) return false;
    
    const matchesSearch = 
      contract.analysis.inquilino_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.analysis.inquilino_cpf.includes(searchTerm.replace(/\D/g, ''));
    
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
                    <TableHead className="text-right">Valor</TableHead>
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
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.variant} className="text-xs">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {hasRejectedDoc && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                Doc. Rejeitado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(contract.analysis?.valor_aluguel || 0)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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