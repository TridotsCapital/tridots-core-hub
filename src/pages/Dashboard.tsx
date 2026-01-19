import { useAnalyses } from '@/hooks/useAnalyses';
import { useAgencies } from '@/hooks/useAgencies';
import { useCommissions } from '@/hooks/useCommissions';
import { usePendingAgenciesCount } from '@/hooks/usePendingAgencies';
import { usePaymentInterestMetrics } from '@/hooks/usePaymentInterestMetrics';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileSearch, 
  Building2, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  MousePointerClick
} from 'lucide-react';
import { statusConfig } from '@/types/database';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { user, loading, role } = useAuth();

  // Wait for auth to resolve before rendering anything
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect agency users to their portal
  if (role === 'agency_user') {
    return <Navigate to="/agency" replace />;
  }

  // Wait for role to be determined before showing internal dashboard
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  const { data: analyses, isLoading: loadingAnalyses } = useAnalyses();
  const { data: agencies, isLoading: loadingAgencies } = useAgencies();
  const { data: commissions, isLoading: loadingCommissions } = useCommissions();
  const { data: pendingAgenciesCount = 0 } = usePendingAgenciesCount();
  const { data: paymentInterestMetrics } = usePaymentInterestMetrics();

  const pendingAnalyses = analyses?.filter(a => a.status === 'pendente').length || 0;
  const inProgressAnalyses = analyses?.filter(a => a.status === 'em_analise').length || 0;
  const approvedAnalyses = analyses?.filter(a => a.status === 'aprovada').length || 0;
  const rejectedAnalyses = analyses?.filter(a => a.status === 'reprovada').length || 0;

  const pendingCommissions = commissions?.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0) || 0;
  const paidCommissions = commissions?.filter(c => c.status === 'paga').reduce((acc, c) => acc + c.valor, 0) || 0;

  const recentAnalyses = analyses?.slice(0, 5) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <DashboardLayout title="Dashboard" description="Visão geral do sistema">
      <div className="space-y-6">
        {/* Pending Agencies Alert */}
        {pendingAgenciesCount > 0 && (
          <Link to="/agencies?status=pending">
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    {pendingAgenciesCount} imobiliária{pendingAgenciesCount > 1 ? 's' : ''} aguardando ativação
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Clique para revisar e ativar
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-amber-600" />
              </CardContent>
            </Card>
          </Link>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover border-l-4 border-l-warning animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Análises Pendentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAnalyses ? '-' : pendingAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando análise
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-success animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Análises Aprovadas
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAnalyses ? '-' : approvedAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total aprovadas
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-primary animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imobiliárias Ativas
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAgencies ? '-' : agencies?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Parceiros cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-warning animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissões Pendentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingCommissions ? '-' : formatCurrency(pendingCommissions)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                A pagar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-hover animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              <div className="p-2 rounded-lg bg-info/10">
                <FileSearch className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressAnalyses}</div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up" style={{ animationDelay: '250ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reprovadas</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedAnalyses}</div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paidCommissions)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card className="animate-slide-up" style={{ animationDelay: '350ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Análises Recentes</CardTitle>
            <Link 
              to="/analyses" 
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              Ver todas
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma análise encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalyses.map((analysis, index) => (
                  <Link
                    key={analysis.id}
                    to={`/analyses/${analysis.id}`}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">
                        {analysis.inquilino_nome}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {analysis.agency?.razao_social}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                        {formatCurrency(analysis.valor_aluguel)}
                      </span>
                      <Badge 
                        variant="secondary"
                        className={`status-badge ${statusConfig[analysis.status].class}`}
                      >
                        {statusConfig[analysis.status].label}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Interest Metrics */}
        {paymentInterestMetrics && paymentInterestMetrics.totalClicks > 0 && (
          <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <MousePointerClick className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Interesse: Pagamento via Imobiliária</CardTitle>
                  <p className="text-sm text-muted-foreground">Cliques na opção "Boleto Mensal Unificado"</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{paymentInterestMetrics.totalClicks}</p>
                  <p className="text-xs text-muted-foreground">cliques totais</p>
                </div>
                {paymentInterestMetrics.clicksToday > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    +{paymentInterestMetrics.clicksToday} hoje
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead className="text-center">Cliques</TableHead>
                    <TableHead className="text-right">Último Clique</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentInterestMetrics.clicksByAgency.map((agency, index) => (
                    <TableRow key={agency.agency_id || index}>
                      <TableCell className="font-medium">
                        {agency.agency_name}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{agency.clicks}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(agency.last_click), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
