import { useState } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useMonthlyInvoiceSummary, useAgencyMonthInstallments } from "@/hooks/useMonthlyInvoiceSummary";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { MonthlyInvoiceChart } from "@/components/invoices/MonthlyInvoiceChart";
import { formatCurrency } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, ExternalLink } from "lucide-react";
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

export default function AgencyInvoices() {
  const { agencyPath } = useAgencyPath();
  const navigate = useNavigate();
  const { data: agencyUserData } = useAgencyUser();
  const agencyId = agencyUserData?.agency_id;
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Hooks
  const { data: monthlySummary = [], isLoading: summaryLoading } = useMonthlyInvoiceSummary(agencyId);
  const { data: installments = [], isLoading: installmentsLoading } = useAgencyMonthInstallments(agencyId, selectedMonth, selectedYear);

  // Check for overdue invoices
  const hasOverdue = monthlySummary.some(m => m.status === 'atrasada');

  const handleSelectMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleGoToContract = (analysisId: string) => {
    if (!analysisId) return;
    navigate(agencyPath(`/contracts/${analysisId}`));
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

        {/* QUADRANTE 1: Resumo do mês + Gráfico de barras */}
        <MonthlyInvoiceChart
          data={monthlySummary}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonth={handleSelectMonth}
          isLoading={summaryLoading}
          showStatus={true}
        />

        {/* Invoice Detail Button — when there's an invoice for the selected month */}
        {(() => {
          const selectedSummary = monthlySummary.find(
            (m) => m.month === selectedMonth && m.year === selectedYear
          );
          if (selectedSummary?.invoiceId) {
            return (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Fatura de {selectedMonth}/{selectedYear}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSummary.hasBoleto && (
                          <Badge variant="default" className="mr-2 text-xs bg-green-600">
                            Boleto disponível
                          </Badge>
                        )}
                        Clique para ver boleto, código de barras e observações
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(agencyPath(`/invoices/${selectedSummary.invoiceId}`))}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver detalhes da fatura
                  </Button>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        {/* QUADRANTE 2: Detalhes dos contratos/parcelas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
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
              <>
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
                            onClick={() => handleGoToContract(item.analysis_id)}
                            disabled={!item.analysis_id}
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

                {/* Total Summary */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="font-medium">Total de Parcelas: {installments.length}</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(installments.reduce((sum: number, item: any) => sum + (item.value || 0), 0))}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AgencyLayout>
  );
}
