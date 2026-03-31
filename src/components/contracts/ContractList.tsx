import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  FileCheck,
  ShieldAlert,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/validators';
import { useContractsWithActiveClaims } from '@/hooks/useContractsWithActiveClaims';
import type { Database } from '@/integrations/supabase/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

const STATUS_CONFIG: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  documentacao_pendente: { label: 'Doc. Pendente', variant: 'secondary' },
  ativo: { label: 'Ativo', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  encerrado: { label: 'Encerrado', variant: 'outline' },
  vencido: { label: 'Vencido', variant: 'outline' },
};

interface Contract {
  id: string;
  status: ContractStatus;
  created_at: string;
  activation_pending?: boolean;
  doc_contrato_locacao_status?: string | null;
  doc_vistoria_inicial_status?: string | null;
  doc_seguro_incendio_status?: string | null;
  analysis: {
    id: string;
    inquilino_nome: string;
    inquilino_cpf: string;
    imovel_cidade: string;
    imovel_estado: string;
    valor_aluguel: number;
    valor_total: number | null;
    taxa_garantia_percentual: number;
    garantia_anual: number | null;
    approved_at: string | null;
    payments_validated_at?: string | null;
    guarantee_payment_date?: string | null;
  } | null;
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
  
  const contractIds = useMemo(() => contracts.map(c => c.id), [contracts]);
  const { data: contractsWithActiveClaims } = useContractsWithActiveClaims(contractIds);

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
        Inquilino: c.analysis?.inquilino_nome || '-',
        CPF: c.analysis?.inquilino_cpf || '-',
        Imobiliária: c.agency?.nome_fantasia || c.agency?.razao_social || '-',
        Cidade: c.analysis?.imovel_cidade || '-',
        Estado: c.analysis?.imovel_estado || '-',
        'Valor Locatício': c.analysis?.valor_total || c.analysis?.valor_aluguel || 0,
        Cobertura: c.analysis?.garantia_anual || 0,
        'Taxa %': c.analysis?.taxa_garantia_percentual || 0,
        Status: STATUS_CONFIG[c.status]?.label || c.status,
        'Data Criação': c.analysis?.guarantee_payment_date 
          ? format(new Date(c.analysis.guarantee_payment_date), 'dd/MM/yyyy')
          : c.analysis?.payments_validated_at 
            ? format(new Date(c.analysis.payments_validated_at), 'dd/MM/yyyy')
            : format(new Date(c.created_at), 'dd/MM/yyyy'),
      }));

    if (data.length === 0) return;

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

  // DEBUG v2: Force rebuild - Verify is_migrated data
  console.log('[ContractList] DEBUG v2 - contracts with is_migrated:', contracts.filter((c: any) => c.is_migrated).map((c: any) => ({ id: c.id, is_migrated: c.is_migrated })));
  console.log('[ContractList] Total contracts loaded:', contracts.length);

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg">Nenhum contrato encontrado</h3>
        <p className="text-muted-foreground">Contratos são criados após confirmação de pagamento</p>
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
              <TableHead className="text-right">Valor Locatício</TableHead>
              <TableHead className="text-right">Garantia Anual</TableHead>
              <TableHead className="text-right">Cobertura 20x</TableHead>
              <TableHead className="text-center">Taxa %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criação</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map(contract => {
              const status = STATUS_CONFIG[contract.status];
              // Check if any document is pending validation (status = 'enviado')
              const hasPendingDocs = 
                contract.doc_contrato_locacao_status === 'enviado' ||
                contract.doc_vistoria_inicial_status === 'enviado' ||
                contract.doc_seguro_incendio_status === 'enviado';
              // Check if contract is ready for activation (all docs approved)
              const isActivationPending = contract.activation_pending || (
                contract.status === 'documentacao_pendente' &&
                contract.doc_contrato_locacao_status === 'aprovado' &&
                contract.doc_vistoria_inicial_status === 'aprovado' &&
                contract.doc_seguro_incendio_status === 'aprovado'
              );
              // Check if contract has an active claim
              const hasActiveClaim = contractsWithActiveClaims?.has(contract.id) ?? false;
              return (
                <TableRow 
                  key={contract.id}
                  className={`cursor-pointer hover:bg-muted/50 ${isActivationPending ? 'bg-green-50/50 dark:bg-green-950/20' : hasPendingDocs ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(contract.id)}
                      onCheckedChange={() => toggleSelect(contract.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      #{contract.id.slice(0, 8).toUpperCase()}
                      {isActivationPending && (
                        <span className="flex h-2 w-2 relative" title="Pronto para ativar">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {!isActivationPending && hasPendingDocs && (
                        <span className="flex h-2 w-2 relative" title="Documentos pendentes de validação">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.analysis?.inquilino_nome || '-'}</p>
                      <p className="text-xs text-muted-foreground">{contract.analysis?.inquilino_cpf || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.agency?.nome_fantasia || contract.agency?.razao_social || '-'}
                  </TableCell>
                  <TableCell>
                    {contract.analysis?.imovel_cidade}, {contract.analysis?.imovel_estado}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {contract.analysis?.valor_total ? formatCurrency(contract.analysis.valor_total) : formatCurrency(contract.analysis?.valor_aluguel || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {contract.analysis?.garantia_anual 
                      ? formatCurrency(contract.analysis.garantia_anual)
                      : contract.analysis?.valor_total && contract.analysis?.taxa_garantia_percentual
                        ? formatCurrency(contract.analysis.valor_total * 12 * (contract.analysis.taxa_garantia_percentual / 100))
                        : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {contract.analysis?.valor_total 
                      ? formatCurrency(contract.analysis.valor_total * 20)
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {contract.analysis?.taxa_garantia_percentual?.toFixed(1) || '-'}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={status?.variant || 'secondary'}>{status?.label || contract.status}</Badge>
                      {(contract as any).is_migrated && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700 dark:text-purple-400 text-xs">
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Migrado
                        </Badge>
                      )}
                      {hasActiveClaim && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400 text-xs">
                          <span className="relative flex h-2 w-2 mr-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Garantia em Andamento
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.analysis?.guarantee_payment_date 
                      ? format(new Date(contract.analysis.guarantee_payment_date), 'dd/MM/yyyy', { locale: ptBR })
                      : contract.analysis?.payments_validated_at 
                        ? format(new Date(contract.analysis.payments_validated_at), 'dd/MM/yyyy', { locale: ptBR })
                        : format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
