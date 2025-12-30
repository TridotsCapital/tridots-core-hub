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
  TrendingUp
} from 'lucide-react';
import { statusConfig } from '@/types/database';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Análises Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAnalyses ? '-' : pendingAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando análise
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Análises Aprovadas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAnalyses ? '-' : approvedAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total aprovadas
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imobiliárias Ativas
              </CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loadingAgencies ? '-' : agencies?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Parceiros cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissões Pendentes
              </CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
              <FileSearch className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressAnalyses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reprovadas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedAnalyses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paidCommissions)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Análises Recentes</CardTitle>
            <Link to="/analyses" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma análise encontrada
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    to={`/analyses/${analysis.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{analysis.inquilino_nome}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {analysis.agency?.razao_social}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
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
