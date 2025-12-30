import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyses } from '@/hooks/useAnalyses';
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
import { Plus, Search, FileSearch, Eye } from 'lucide-react';
import { statusConfig, AnalysisStatus } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Analyses() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'all'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');

  const { data: agencies } = useAgencies();
  const { data: analyses, isLoading } = useAnalyses({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
  });

  const filteredAnalyses = analyses?.filter(analysis => 
    analysis.inquilino_nome.toLowerCase().includes(search.toLowerCase()) ||
    analysis.inquilino_cpf.includes(search) ||
    analysis.imovel_endereco.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <DashboardLayout title="Análises" description="Gestão de análises de crédito">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou endereço..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AnalysisStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="reprovada">Reprovada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
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

          <Button asChild>
            <Link to="/analyses/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Análise
            </Link>
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAnalyses?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileSearch className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma análise encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses?.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{analysis.inquilino_nome}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {analysis.inquilino_cpf}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {analysis.agency?.razao_social || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate text-sm">{analysis.imovel_endereco}</p>
                          <p className="text-xs text-muted-foreground">
                            {analysis.imovel_cidade}/{analysis.imovel_estado}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(analysis.valor_aluguel)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(analysis.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`status-badge ${statusConfig[analysis.status].class}`}
                        >
                          {statusConfig[analysis.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/analyses/${analysis.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
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
