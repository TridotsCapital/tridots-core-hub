import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MoreHorizontal, Eye, MessageSquare, FileText, XCircle, Loader2, FileSearch } from 'lucide-react';
import { formatCurrency } from '@/lib/validators';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { useUnreadItemIds, useMarkItemAsRead } from '@/hooks/useUnreadItemIds';
import { cn } from '@/lib/utils';

type AnalysisStatus = Database['public']['Enums']['analysis_status'];

interface Analysis {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  status: AnalysisStatus;
  valor_aluguel: number;
  valor_total: number | null;
  created_at: string;
  approved_at: string | null;
}

interface AgencyContractListProps {
  analyses: Analysis[];
  isLoading: boolean;
  onRefresh: () => void;
  autoOpenContractId?: string | null;
  onAutoOpenHandled?: () => void;
}

const STATUS_CONFIG: Record<AnalysisStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  em_analise: { label: 'Em Análise', variant: 'outline' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  aguardando_pagamento: { label: 'Aguardando Pgto', variant: 'outline' },
  ativo: { label: 'Ativo', variant: 'default' },
};

export function AgencyContractList({ analyses, isLoading, onRefresh, autoOpenContractId, onAutoOpenHandled }: AgencyContractListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: unreadIds } = useUnreadItemIds();
  const markAsRead = useMarkItemAsRead();

  // Auto-open contract from notification
  useEffect(() => {
    if (autoOpenContractId && analyses.length > 0) {
      const analysis = analyses.find(a => a.id === autoOpenContractId);
      if (analysis) {
        navigate(`/agency/contracts/${autoOpenContractId}`);
        onAutoOpenHandled?.();
      }
    }
  }, [autoOpenContractId, analyses, navigate, onAutoOpenHandled]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Filter analyses
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = 
      analysis.inquilino_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.inquilino_cpf.includes(searchTerm.replace(/\D/g, ''));
    
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCancelClick = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAnalysis) return;
    
    setIsCanceling(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .update({ 
          status: 'cancelada',
          canceled_at: new Date().toISOString()
        })
        .eq('id', selectedAnalysis.id);

      if (error) throw error;

      toast.success('Análise cancelada com sucesso');
      setCancelDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error('Erro ao cancelar análise: ' + error.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const canCancel = (status: AnalysisStatus) => {
    return status === 'pendente' || status === 'em_analise';
  };

  const formatCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
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
            Contratos ({filteredAnalyses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum contrato encontrado</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm">Tente ajustar os filtros</p>
              ) : null}
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
                  {filteredAnalyses.map((analysis) => {
                    const statusConfig = STATUS_CONFIG[analysis.status];
                    const hasUnread = unreadIds?.contratos.has(analysis.id) ?? false;

                    const handleRowClick = () => {
                      if (hasUnread) {
                        markAsRead(analysis.id, 'contratos');
                      }
                      navigate(`/agency/contracts/${analysis.id}`);
                    };

                    return (
                      <TableRow 
                        key={analysis.id} 
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
                          #{analysis.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{analysis.inquilino_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCpf(analysis.inquilino_cpf)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(analysis.valor_aluguel)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(analysis.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => navigate(`/agency/contracts/${analysis.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate('/agency/support', { 
                                  state: { 
                                    prefillSubject: `Dúvida sobre análise #${analysis.id.slice(0, 8).toUpperCase()}` 
                                  } 
                                })}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Abrir Chamado
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => navigate(`/agency/contracts/${analysis.id}?tab=documents`)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Baixar Termos
                              </DropdownMenuItem>
                              {canCancel(analysis.status) && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancelClick(analysis)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancelar Análise
                                </DropdownMenuItem>
                              )}
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Análise</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a análise de{' '}
              <strong>{selectedAnalysis?.inquilino_nome}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Manter Análise
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={isCanceling}
            >
              {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
