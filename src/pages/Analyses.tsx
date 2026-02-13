import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useAgencies } from '@/hooks/useAgencies';
import { useTeamMembers } from '@/hooks/useAnalysesKanban';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard } from '@/components/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import { Plus, Search, FileSearch, Eye, LayoutGrid, List } from 'lucide-react';
import { statusConfig, AnalysisStatus } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnreadItemIds } from '@/hooks/useUnreadItemIds';

type ViewMode = 'kanban' | 'table';

export default function Analyses() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'all'>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [analystFilter, setAnalystFilter] = useState<string>('all');
  const [unreadFilter, setUnreadFilter] = useState<'all' | 'unread'>('all');
  const [autoOpenAnalysisId, setAutoOpenAnalysisId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('analyses-view-mode') as ViewMode) || 'kanban';
  });

  const { data: agencies } = useAgencies();
  const { data: teamMembers } = useTeamMembers();
  const { data: unreadIds } = useUnreadItemIds();
  const { data: analyses, isLoading } = useAnalyses({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
    analyst_id: analystFilter !== 'all' ? analystFilter : undefined,
  });

  // Auto-open analysis from notification
  useEffect(() => {
    const state = location.state as { analysisId?: string } | null;
    if (state?.analysisId) {
      setAutoOpenAnalysisId(state.analysisId);
      // Clear state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('analyses-view-mode', viewMode);
  }, [viewMode]);

  const filteredAnalyses = analyses?.filter(analysis => {
    const matchesSearch = analysis.inquilino_nome.toLowerCase().includes(search.toLowerCase()) ||
      analysis.inquilino_cpf.includes(search) ||
      analysis.imovel_endereco.toLowerCase().includes(search.toLowerCase());
    
    // Filter by unread
    if (unreadFilter === 'unread') {
      return matchesSearch && unreadIds?.analises.has(analysis.id);
    }
    
    return matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <DashboardLayout title="Análises" description="Gestão de análises de crédito">
      <div className="space-y-4 animate-fade-in">
        {/* Line 1: Search + View Toggle + New Analysis Button */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, ID, imobiliária, analista, telefone, email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="border rounded-lg p-1"
          >
            <ToggleGroupItem value="kanban" aria-label="Visualização Kanban" className="px-3">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Visualização Tabela" className="px-3">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button asChild>
            <Link to="/analyses/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Análise
            </Link>
          </Button>
        </div>

        {/* Line 2: Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AnalysisStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="reprovada">Reprovada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unreadFilter} onValueChange={(v) => setUnreadFilter(v as 'all' | 'unread')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Leitura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unread">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Não lidos
                </div>
              </SelectItem>
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

          <Select value={analystFilter} onValueChange={setAnalystFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Analista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os analistas</SelectItem>
              {teamMembers?.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            filters={{
              agency_id: agencyFilter !== 'all' ? agencyFilter : undefined,
              analyst_id: analystFilter !== 'all' ? analystFilter : undefined,
              unread_only: unreadFilter === 'unread',
              searchTerm: search,
            }}
            autoOpenAnalysisId={autoOpenAnalysisId}
            onAutoOpenHandled={() => setAutoOpenAnalysisId(null)}
          />
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
}
