import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CreditCard,
  FileText,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/validators';
import type { Database } from '@/integrations/supabase/types';

type AnalysisStatus = Database['public']['Enums']['analysis_status'];

const STATUS_CONFIG: Record<AnalysisStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', variant: 'secondary' },
  ativo: { label: 'Ativo', variant: 'default' },
};

interface Contract {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  imovel_cidade: string;
  imovel_estado: string;
  valor_aluguel: number;
  status: AnalysisStatus;
  created_at: string;
  approved_at: string | null;
  agency: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
}

interface Props {
  contracts: Contract[];
  isLoading: boolean;
  onRenew?: (contract: Contract) => void;
  onFlagPendency?: (contract: Contract) => void;
  onViewPayments?: (contract: Contract) => void;
}

export function ContractList({ contracts, isLoading, onRenew, onFlagPendency, onViewPayments }: Props) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contracts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contracts.map(c => c.id));
    }
  };

  const handleExport = () => {
    const data = contracts
      .filter(c => selectedIds.length === 0 || selectedIds.includes(c.id))
      .map(c => ({
        Código: c.id.slice(0, 8).toUpperCase(),
        Inquilino: c.inquilino_nome,
        CPF: c.inquilino_cpf,
        Imobiliária: c.agency?.nome_fantasia || c.agency?.razao_social || '-',
        Cidade: c.imovel_cidade,
        Estado: c.imovel_estado,
        Aluguel: c.valor_aluguel,
        Status: STATUS_CONFIG[c.status].label,
        'Data Aprovação': c.approved_at ? format(new Date(c.approved_at), 'dd/MM/yyyy') : '-',
      }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contratos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg">Nenhum contrato encontrado</h3>
        <p className="text-muted-foreground">Ajuste os filtros para ver resultados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selecionado(s)
          </span>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === contracts.length && contracts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Imobiliária</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Aluguel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aprovação</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map(contract => {
              const status = STATUS_CONFIG[contract.status];
              return (
                <TableRow 
                  key={contract.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(contract.id)}
                      onCheckedChange={() => toggleSelect(contract.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    #{contract.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.inquilino_nome}</p>
                      <p className="text-xs text-muted-foreground">{contract.inquilino_cpf}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.agency?.nome_fantasia || contract.agency?.razao_social || '-'}
                  </TableCell>
                  <TableCell>
                    {contract.imovel_cidade}, {contract.imovel_estado}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(contract.valor_aluguel)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {contract.approved_at 
                      ? format(new Date(contract.approved_at), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {onViewPayments && (
                          <DropdownMenuItem onClick={() => onViewPayments(contract)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ver Pagamentos
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onRenew && contract.status === 'ativo' && (
                          <DropdownMenuItem onClick={() => onRenew(contract)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renovar Contrato
                          </DropdownMenuItem>
                        )}
                        {onFlagPendency && (
                          <DropdownMenuItem onClick={() => onFlagPendency(contract)}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Sinalizar Pendência
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

      <div className="text-sm text-muted-foreground text-right">
        Mostrando {contracts.length} contrato(s)
      </div>
    </div>
  );
}