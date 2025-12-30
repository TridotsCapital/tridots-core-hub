import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Search, Filter, Shield, AlertTriangle } from "lucide-react";
import { Navigate } from "react-router-dom";

const AuditViewer = () => {
  const { isMaster, loading } = useAuth();
  const [tableName, setTableName] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: logs, isLoading } = useAuditLogs({
    tableName: tableName || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isMaster) {
    return <Navigate to="/" replace />;
  }

  const getActionBadge = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case "insert":
      case "create":
        return <Badge className="bg-green-500">Criação</Badge>;
      case "update":
        return <Badge className="bg-blue-500">Atualização</Badge>;
      case "delete":
        return <Badge variant="destructive">Exclusão</Badge>;
      case "acceptance":
        return <Badge className="bg-purple-500">Aceite Digital</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  const formatLogData = (data: Record<string, unknown> | null) => {
    if (!data) return "-";
    
    const relevantFields = ["inquilino_nome", "status", "name", "email", "accepted_by_name"];
    const displayFields: string[] = [];
    
    for (const field of relevantFields) {
      if (data[field]) {
        displayFields.push(`${field}: ${data[field]}`);
      }
    }
    
    return displayFields.length > 0 ? displayFields.join(", ") : JSON.stringify(data).slice(0, 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Visualizador de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Histórico completo de todas as ações críticas do sistema
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tabela</label>
                <Select value={tableName} onValueChange={setTableName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="analyses">Análises</SelectItem>
                    <SelectItem value="agencies">Imobiliárias</SelectItem>
                    <SelectItem value="commissions">Comissões</SelectItem>
                    <SelectItem value="digital_acceptances">Aceites Digitais</SelectItem>
                    <SelectItem value="term_templates">Modelos de Termos</SelectItem>
                    <SelectItem value="user_roles">Permissões</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ação</label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="INSERT">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                    <SelectItem value="acceptance">Aceite Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>
              {logs?.length || 0} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !logs?.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground text-center">
                  Não há registros de auditoria com os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>User-Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {log.table_name}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {formatLogData(log.new_data || log.old_data)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {log.user_agent || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                Política de Retenção
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Os logs de auditoria são mantidos permanentemente conforme política de compliance.
                Esses registros são imutáveis e não podem ser editados ou excluídos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditViewer;
