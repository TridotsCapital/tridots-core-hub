import { useState, useMemo } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useMonthlyInvoiceSummary, useAgencyMonthInstallments } from "@/hooks/useMonthlyInvoiceSummary";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { MonthlyInvoiceChart } from "@/components/invoices/MonthlyInvoiceChart";
import { formatCurrency } from "@/lib/validators";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgencyInvoiceExports } from "@/hooks/useAgencyInvoiceExports";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  gerada: { label: "Gerada", variant: "default" },
  enviada: { label: "Enviada", variant: "default" },
  atrasada: { label: "Atrasada", variant: "destructive" },
  paga: { label: "Paga", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "secondary" },
  futura: { label: "Aguardando Faturamento", variant: "secondary" },
  pendente: { label: "Pendente", variant: "default" },
};

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function AgencyInvoices() {
  const { agencyPath } = useAgencyPath();
  const navigate = useNavigate();
  const { data: agencyUserData } = useAgencyUser();
  const agencyId = agencyUserData?.agency_id;
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { isExporting, exportInvoice } = useAgencyInvoiceExports();
  
  // Hooks
  const { data: monthlySummary = [], isLoading: summaryLoading } = useMonthlyInvoiceSummary(agencyId);
  const { data: installments = [], isLoading: installmentsLoading } = useAgencyMonthInstallments(agencyId, selectedMonth, selectedYear);

  // Selected month data
  const selectedMonthData = useMemo(() => {
    return monthlySummary.find(m => m.month === selectedMonth && m.year === selectedYear);
  }, [monthlySummary, selectedMonth, selectedYear]);

  // Check for overdue invoices
  const hasOverdue = useMemo(() => {
    return monthlySummary.some(m => m.status === 'atrasada');
  }, [monthlySummary]);

  const handleSelectMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleGoToContract = (contractId: string) => {
    navigate(agencyPath(`/contracts/${contractId}`));
  };

  return (
    <AgencyLayout
      title="Minhas Faturas"
      description="Acompanhe suas faturas de garantia"
    >
      <div className="space-y-6">
        {/* Overdue Alert */}
        {hasOverdue && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Fatura em atraso</p>
              <p className="text-sm text-destructive/80">
                Você possui faturas vencidas. Por favor, regularize o pagamento para evitar bloqueios.
              </p>
            </div>
          </div>
        )}

        {/* Monthly Chart (Nubank style) */}
        <MonthlyInvoiceChart
          data={monthlySummary}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonth={handleSelectMonth}
          isLoading={summaryLoading}
        />

        {/* Selected Month Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </h3>
                  {selectedMonthData?.dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {format(new Date(selectedMonthData.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedMonthData?.totalValue || 0)}</p>
                </div>
                {selectedMonthData?.hasInvoice && (
                  <Badge variant={statusConfig[selectedMonthData.status]?.variant || "default"} className="text-sm px-3 py-1">
                    {statusConfig[selectedMonthData.status]?.label || selectedMonthData.status}
                  </Badge>
                )}
                {!selectedMonthData?.hasInvoice && selectedMonthData?.totalValue && selectedMonthData.totalValue > 0 && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Aguardando Faturamento
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts/Installments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {installmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : installments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma parcela neste período.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tenant_name}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {item.property_address}
                      </TableCell>
                      <TableCell>{item.installment_number}/12</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.value)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusConfig[item.invoiceStatus]?.variant || "outline"} 
                          className="text-xs"
                        >
                          {item.hasInvoice ? 'Faturada' : 'Aguardando'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGoToContract(item.contract_id)}
                          className="gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver Contrato
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Total Summary Footer */}
        {installments.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de Parcelas: {installments.length}</span>
                <span className="text-xl font-bold">
                  {formatCurrency(installments.reduce((sum: number, item: any) => sum + (item.value || 0), 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AgencyLayout>
  );
}
