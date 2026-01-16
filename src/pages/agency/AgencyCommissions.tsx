import { useState } from 'react';
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { useAgencyCommissions, useAgencyCommissionsSummary } from "@/hooks/useCommissions";
import { commissionStatusConfig } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  CalendarDays,
  Loader2,
  Receipt
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];
const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function AgencyCommissions() {
  const { data: agencyUser } = useAgencyUser();
  const agencyId = agencyUser?.agency_id;
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  
  const { data: commissions, isLoading } = useAgencyCommissions(agencyId || undefined);
  const { data: summary } = useAgencyCommissionsSummary(agencyId || undefined);

  // Filter commissions
  const filteredCommissions = commissions?.filter(c => {
    if (selectedMonth !== 'all' && c.mes_referencia !== parseInt(selectedMonth)) return false;
    if (selectedYear !== 'all' && c.ano_referencia !== parseInt(selectedYear)) return false;
    return true;
  }) || [];

  const setupCommissions = filteredCommissions.filter(c => c.type === 'setup');
  const recurringCommissions = filteredCommissions.filter(c => c.type === 'recorrente');

  return (
    <AgencyLayout 
      title="Comissões" 
      description="Acompanhe suas comissões"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.pendente || 0)}</div>
              <p className="text-xs text-muted-foreground">Aguardando vencimento</p>
            </CardContent>
          </Card>
          
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.a_pagar || 0)}</div>
              <p className="text-xs text-muted-foreground">Disponível para pagamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.paga || 0)}</div>
              <p className="text-xs text-muted-foreground">Total já recebido</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.total || 0)}</div>
              <p className="text-xs text-muted-foreground">Todas as comissões</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commissions Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="recorrentes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="recorrentes" className="gap-2">
                <Receipt className="h-4 w-4" />
                Recorrentes ({recurringCommissions.length})
              </TabsTrigger>
              <TabsTrigger value="setup" className="gap-2">
                <Wallet className="h-4 w-4" />
                Setup ({setupCommissions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recorrentes">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringCommissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhuma comissão recorrente encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        recurringCommissions.map(commission => (
                          <TableRow key={commission.id}>
                            <TableCell className="font-medium">
                              {(commission.analysis as any)?.inquilino_nome || '-'}
                            </TableCell>
                            <TableCell>
                              {commission.mes_referencia && commission.ano_referencia 
                                ? `${months.find(m => m.value === commission.mes_referencia)?.label.slice(0, 3)}/${commission.ano_referencia}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {commission.due_date 
                                ? format(new Date(commission.due_date), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(commission.valor)}
                            </TableCell>
                            <TableCell>
                              <Badge className={commissionStatusConfig[commission.status].class}>
                                {commissionStatusConfig[commission.status].label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="setup">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {setupCommissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhuma comissão de setup encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        setupCommissions.map(commission => (
                          <TableRow key={commission.id}>
                            <TableCell className="font-medium">
                              {(commission.analysis as any)?.inquilino_nome || '-'}
                            </TableCell>
                            <TableCell>
                              {(commission.analysis as any)?.imovel_endereco 
                                ? `${(commission.analysis as any).imovel_endereco}, ${(commission.analysis as any).imovel_cidade}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(commission.valor)}
                            </TableCell>
                            <TableCell>
                              <Badge className={commissionStatusConfig[commission.status].class}>
                                {commissionStatusConfig[commission.status].label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AgencyLayout>
  );
}