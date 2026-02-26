import { useState } from "react";
import { AgencyLayout } from "@/components/layout/AgencyLayout";
import { useMonthlyInvoiceSummary, useAgencyMonthInstallments } from "@/hooks/useMonthlyInvoiceSummary";
import { useAgencyUser } from "@/hooks/useAgencyUser";
import { MonthlyInvoiceChart } from "@/components/invoices/MonthlyInvoiceChart";
import { formatCurrency } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, ExternalLink, Download, Copy, Info, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgencyPath } from "@/hooks/useAgencyPath";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

        {/* Seção inline de boleto — entre gráfico e tabela */}
        {(() => {
          const selectedSummary = monthlySummary.find(
            (m) => m.month === selectedMonth && m.year === selectedYear
          );
          if (!selectedSummary?.hasBoleto) return null;

          const handleDownloadBoleto = async () => {
            if (!selectedSummary.boletoUrl) return;
            try {
              // Extract storage path from URL
              let storagePath = selectedSummary.boletoUrl;
              const publicMatch = storagePath.match(/\/object\/public\/invoices\/(.+)/);
              const signMatch = storagePath.match(/\/object\/sign\/invoices\/(.+?)(\?|$)/);
              if (publicMatch) storagePath = publicMatch[1];
              else if (signMatch) storagePath = signMatch[1];
              else if (storagePath.startsWith('invoices/')) storagePath = storagePath.replace('invoices/', '');

              const { data, error } = await supabase.storage.from('invoices').download(storagePath);
              if (error) throw error;
              const url = URL.createObjectURL(data);
              const a = document.createElement('a');
              a.href = url;
              a.download = `boleto-${selectedMonth}-${selectedYear}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Erro ao baixar boleto:', err);
              toast.error('Não foi possível baixar o boleto. Tente novamente.');
            }
          };

          const handleCopyBarcode = () => {
            if (!selectedSummary.boletoBarcode) return;
            navigator.clipboard.writeText(selectedSummary.boletoBarcode);
            toast.success('Código de barras copiado!');
          };

          const statusBadge = (() => {
            if (selectedSummary.status === 'paga') {
              return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"><Check className="h-3 w-3 mr-1" />Fatura Paga</Badge>;
            }
            if (selectedSummary.status === 'atrasada') {
              return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="h-3 w-3 mr-1" />Fatura Atrasada</Badge>;
            }
            if (selectedSummary.hasBoleto) {
              return <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800"><FileText className="h-3 w-3 mr-1" />Boleto Disponível</Badge>;
            }
            return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pendente</Badge>;
          })();

          return (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Boleto — {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
                  </CardTitle>
                  {statusBadge}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download button */}
                {selectedSummary.status !== 'paga' && (
                  <Button onClick={handleDownloadBoleto} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Boleto (PDF)
                  </Button>
                )}
                {selectedSummary.status === 'paga' && (
                  <Button variant="outline" onClick={handleDownloadBoleto} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Boleto (PDF)
                  </Button>
                )}

                {/* Barcode */}
                {selectedSummary.boletoBarcode && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Código de barras</p>
                    <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-2">
                      <code className="text-xs flex-1 break-all font-mono text-foreground/80">{selectedSummary.boletoBarcode}</code>
                      <Button variant="outline" size="sm" onClick={handleCopyBarcode} className="flex-shrink-0 gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Observations */}
                {selectedSummary.boletoObservations && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Observações</p>
                    <div className="flex gap-2 bg-muted/50 border border-border rounded-md px-3 py-2.5">
                      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/80">{selectedSummary.boletoObservations}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
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
