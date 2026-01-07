import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuditLogs, useAuditUsers, TABLE_LABELS, AuditLog } from "@/hooks/useAuditLogs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Search, Filter, Shield, AlertTriangle, Download, Eye, User } from "lucide-react";
import { Navigate } from "react-router-dom";

const AuditViewer = () => {
  const { isMaster, loading } = useAuth();
  const [tableName, setTableName] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    tableName: tableName && tableName !== "all" ? tableName : undefined,
    action: action && action !== "all" ? action : undefined,
    userId: userId && userId !== "all" ? userId : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: users } = useAuditUsers();

  const tableOptions = useMemo(() => {
    return Object.entries(TABLE_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  const exportToCSV = () => {
    if (!logs?.length) return;

    const headers = ["Data/Hora", "Usuário", "Tabela", "Ação", "ID Registro", "Dados Anteriores", "Dados Novos", "IP", "User-Agent"];
    const rows = logs.map(log => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
      log.user?.full_name || "Sistema",
      TABLE_LABELS[log.table_name] || log.table_name,
      log.action,
      log.record_id || "-",
      log.old_data ? JSON.stringify(log.old_data) : "-",
      log.new_data ? JSON.stringify(log.new_data) : "-",
      log.ip_address || "-",
      log.user_agent || "-",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
    switch (actionType.toUpperCase()) {
      case "INSERT":
        return <Badge className="bg-green-500 hover:bg-green-600">Criação</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Atualização</Badge>;
      case "DELETE":
        return <Badge variant="destructive">Exclusão</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  const getChangedFields = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): string[] => {
    if (!oldData || !newData) return [];
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    allKeys.forEach(key => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changed.push(key);
      }
    });
    return changed;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Visualizador de Auditoria
            </h1>
            <p className="text-muted-foreground">
              Histórico completo de todas as ações do sistema
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={!logs?.length}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
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
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tabela</label>
                <Select value={tableName} onValueChange={setTableName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {tableOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="INSERT">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users?.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
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
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>ID Registro</TableHead>
                      <TableHead>Campos Alterados</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const changedFields = getChangedFields(log.old_data, log.new_data);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {log.user?.full_name || "Sistema"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {TABLE_LABELS[log.table_name] || log.table_name}
                            </code>
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.record_id?.slice(0, 8) || "-"}
                          </TableCell>
                          <TableCell>
                            {log.action === "UPDATE" && changedFields.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {changedFields.slice(0, 3).map(field => (
                                  <Badge key={field} variant="outline" className="text-xs">
                                    {field}
                                  </Badge>
                                ))}
                                {changedFields.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{changedFields.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

      {/* Diff View Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalhes do Registro
              {selectedLog && getActionBadge(selectedLog.action)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Usuário:</span>
                  <p className="font-medium">{selectedLog.user?.full_name || "Sistema"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tabela:</span>
                  <p className="font-medium">{TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID Registro:</span>
                  <p className="font-mono text-xs">{selectedLog.record_id || "-"}</p>
                </div>
              </div>

              {selectedLog.ip_address && (
                <div className="text-sm">
                  <span className="text-muted-foreground">IP: </span>
                  <span className="font-mono">{selectedLog.ip_address}</span>
                </div>
              )}

              {/* Side-by-side Diff View */}
              {selectedLog.action === "UPDATE" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Antes</h4>
                    <ScrollArea className="h-[400px] border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                      <DiffView 
                        data={selectedLog.old_data} 
                        compareData={selectedLog.new_data}
                        mode="old"
                      />
                    </ScrollArea>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Depois</h4>
                    <ScrollArea className="h-[400px] border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                      <DiffView 
                        data={selectedLog.new_data} 
                        compareData={selectedLog.old_data}
                        mode="new"
                      />
                    </ScrollArea>
                  </div>
                </div>
              ) : selectedLog.action === "INSERT" ? (
                <div>
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Dados Criados</h4>
                  <ScrollArea className="h-[400px] border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              ) : selectedLog.action === "DELETE" ? (
                <div>
                  <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Dados Excluídos</h4>
                  <ScrollArea className="h-[400px] border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Component to show diff with highlighted changes
const DiffView = ({ 
  data, 
  compareData, 
  mode 
}: { 
  data: Record<string, unknown> | null; 
  compareData: Record<string, unknown> | null;
  mode: "old" | "new";
}) => {
  if (!data) return <span className="text-muted-foreground">Sem dados</span>;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const isChanged = (key: string): boolean => {
    if (!compareData) return false;
    return JSON.stringify(data[key]) !== JSON.stringify(compareData[key]);
  };

  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value]) => {
        const changed = isChanged(key);
        return (
          <div 
            key={key} 
            className={`text-xs font-mono p-1 rounded ${
              changed 
                ? mode === "old" 
                  ? "bg-red-200 dark:bg-red-900/50" 
                  : "bg-green-200 dark:bg-green-900/50"
                : ""
            }`}
          >
            <span className="text-muted-foreground">{key}:</span>{" "}
            <span className={changed ? "font-semibold" : ""}>
              {formatValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AuditViewer;