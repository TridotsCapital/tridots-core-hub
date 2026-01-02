import { useAnalyses } from '@/hooks/useAnalyses';
import { useAgencies } from '@/hooks/useAgencies';
import { useCommissions } from '@/hooks/useCommissions';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileSearch, 
  Building2, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { statusConfig } from '@/types/database';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { role } = useAuth();

  // Redirect agency users to their portal
  if (role === 'agency_user') {
    return <Navigate to="/agency" replace />;
  }
  const { data: analyses, isLoading: loadingAnalyses } = useAnalyses();
  const { data: agencies, isLoading: loadingAgencies } = useAgencies();
  const { data: commissions, isLoading: loadingCommissions } = useCommissions();

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
      </div>
    </DashboardLayout>
  );
}
