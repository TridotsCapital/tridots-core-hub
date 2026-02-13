import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCloudMetrics } from '@/hooks/useCloudMetrics';
import { useFunctionLogs, useFunctionLogsSummary } from '@/hooks/useFunctionLogs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Database,
  Zap,
  HardDrive,
  Activity,
  Clock,
  TrendingUp,
  BarChart3,
  Loader2,
  AlertTriangle,
  Bug,
} from 'lucide-react';
import { formatDateBR } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--info))'];

export default function CloudMonitoring() {
  const { user, loading, role } = useAuth();
  const { data: metrics, isLoading } = useCloudMetrics();
  const { data: logs, isLoading: logsLoading } = useFunctionLogs(100);
  const { data: logsSummary } = useFunctionLogsSummary();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== 'master') return <Navigate to="/" replace />;

  return (
    <DashboardLayout title="Cloud Monitoring" description="Métricas de consumo e performance do backend">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Queries (24h)
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '-' : metrics?.totals.totalQueries24h.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Operações de banco</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Queries (7 dias)
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '-' : metrics?.totals.totalQueries7d.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total na semana</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Edge Functions
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <Zap className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '-' : metrics?.totals.totalEdgeFunctionCalls.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média: {metrics?.totals.avgEdgeFunctionDuration || 0}ms
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Storage
              </CardTitle>
              <div className="p-2 rounded-lg bg-info/10">
                <HardDrive className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '-' : `${metrics?.totals.totalStorageMB.toFixed(1)} MB`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.totals.totalFiles || 0} arquivos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: 24h vs 7 dias */}
        <Tabs defaultValue="7d" className="space-y-4">
          <TabsList>
            <TabsTrigger value="24h" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Últimas 24h
            </TabsTrigger>
            <TabsTrigger value="7d" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Últimos 7 dias
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <Bug className="h-4 w-4" />
              Observabilidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="24h" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Edge Functions Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-success" />
                    Top Edge Functions (Hoje)
                  </CardTitle>
                  <CardDescription>Funções mais executadas nas últimas 24h</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Função</TableHead>
                          <TableHead className="text-center">Execuções</TableHead>
                          <TableHead className="text-right">Duração Média</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics?.edgeFunctions.slice(0, 5).map((fn) => (
                          <TableRow key={fn.name}>
                            <TableCell className="font-medium font-mono text-xs">
                              {fn.name}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{fn.executions}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {fn.avgDuration}ms
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!metrics?.edgeFunctions || metrics.edgeFunctions.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              Sem dados disponíveis
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Storage Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-info" />
                    Distribuição de Storage
                  </CardTitle>
                  <CardDescription>Uso por tipo de documento</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {metrics?.storageUsage.map((bucket, i) => (
                        <div key={bucket.bucket} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{bucket.bucket}</span>
                            <span className="text-muted-foreground">
                              {bucket.size.toFixed(1)} MB · {bucket.fileCount} arquivos
                            </span>
                          </div>
                          <Progress
                            value={metrics.totals.totalStorageMB > 0
                              ? (bucket.size / metrics.totals.totalStorageMB) * 100
                              : 0}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="7d" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* DB Queries Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Operações de Banco por Dia
                  </CardTitle>
                  <CardDescription>Últimos 7 dias de atividade</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={metrics?.dbQueries || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(val) => {
                            const d = new Date(val + 'T00:00:00');
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(val) => {
                            const d = new Date(val + 'T00:00:00');
                            return d.toLocaleDateString('pt-BR');
                          }}
                          formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Operações']}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Storage Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-info" />
                    Storage por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={metrics?.storageUsage || []}
                          dataKey="fileCount"
                          nameKey="bucket"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ bucket, percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {metrics?.storageUsage.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} arquivos`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Full Edge Functions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-success" />
                  Todas as Edge Functions
                </CardTitle>
                <CardDescription>Ranking por número de execuções</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="text-center">Execuções</TableHead>
                        <TableHead className="text-right">Duração Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics?.edgeFunctions.map((fn, i) => (
                        <TableRow key={fn.name}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium font-mono text-xs">
                            {fn.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{fn.executions}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {fn.avgDuration}ms
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!metrics?.edgeFunctions || metrics.edgeFunctions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Sem dados disponíveis
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs" className="space-y-4">
            {/* Summary by Function */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Resumo por Função
                </CardTitle>
                <CardDescription>Erros, warnings e performance por edge function</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Erros</TableHead>
                      <TableHead className="text-center">Warnings</TableHead>
                      <TableHead className="text-right">Duração Média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsSummary?.map((fn) => (
                      <TableRow key={fn.function_name}>
                        <TableCell className="font-mono text-xs">{fn.function_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{fn.total}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {fn.errors > 0 ? (
                            <Badge variant="destructive">{fn.errors}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {fn.warnings > 0 ? (
                            <Badge className="bg-warning/20 text-warning border-warning/30">{fn.warnings}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {fn.avgDuration > 0 ? `${fn.avgDuration}ms` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!logsSummary || logsSummary.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum log registrado ainda. Os logs aparecerão conforme as funções são executadas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bug className="h-4 w-4 text-destructive" />
                  Logs Recentes
                </CardTitle>
                <CardDescription>Últimos 100 registros de execução</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">Data</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead>Mensagem</TableHead>
                          <TableHead className="text-right">Duração</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs?.map((log) => (
                          <TableRow key={log.id} className={log.level === 'error' ? 'bg-destructive/5' : ''}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateBR(log.created_at, 'dd/MM HH:mm:ss')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.function_name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'outline' : 'secondary'}
                                className={log.level === 'warn' ? 'border-warning text-warning' : ''}
                              >
                                {log.level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">{log.message}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!logs || logs.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              Nenhum log registrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
